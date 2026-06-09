import express from 'express';
import Resource from '../models/Resource.js';
import WeekLock from '../models/WeekLock.js';
import UserProgress from '../models/UserProgress.js';
import { authenticateToken, requireDomainAccess } from '../middleware/auth.js';
import { getEquivalentDomains, normalizeDomain, domainMatches } from '../config/constants.js';

const router = express.Router();

// Get domain resources
router.get('/:domain/resources', authenticateToken, async (req, res) => {
  const { domain } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);

  const hasUserAccess =
    req.user.role !== 'user' ||
    (Array.isArray(req.user.domains) && req.user.domains.some(userDomain => domainMatches(userDomain, domain)));

  if (!hasUserAccess) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    // Sort resources by order ascending, then by createdAt ascending
    const domainResources = await Resource.find({ domain: { $in: equivalentDomains } }).sort({ order: 1, createdAt: 1 });

    // Fetch week lock definitions for this domain
    const locks = await WeekLock.find({ domain: { $in: equivalentDomains } });
    const lockMap = {};
    locks.forEach(l => {
      lockMap[l.week] = l.isLocked;
    });

    // Fetch user completion progress
    const progressList = await UserProgress.find({ userId: req.user.id });
    const completedResourceIds = new Set(
      progressList.filter(p => p.completed).map(p => p.resourceId)
    );

    const isUserAdmin = req.user.role === 'super_admin' || (
      req.user.role === 'admin' &&
      Array.isArray(req.user.adminDomains) &&
      req.user.adminDomains.some(adminDomain => domainMatches(adminDomain, domain))
    );

    // Map progress and mask locked resources if user is a normal student
    const processedResources = domainResources.map(res => {
      const resObj = res.toObject();
      const isWeekLocked = lockMap[res.week] !== false; // Default to locked if lock setting doesn't exist

      resObj.completed = completedResourceIds.has(res.id);

      if (isWeekLocked && !isUserAdmin) {
        resObj.isLocked = true;
        resObj.link = '#';
        if (resObj.links && resObj.links.length > 0) {
          resObj.links = resObj.links.map(l => ({ ...l, url: '#' }));
        }
        resObj.description = 'This resource is locked. Wait for the domain head to unlock this week.';
      } else {
        resObj.isLocked = false;
        // Make sure links array has at least one entry even for legacy resources
        if (!resObj.links || resObj.links.length === 0) {
          resObj.links = [{ title: 'Access Resource', url: resObj.link }];
        }
      }

      return resObj;
    });

    res.json({
      resources: processedResources,
      weekLocks: locks
    });
  } catch (error) {
    console.error('Error retrieving resources:', error);
    res.status(500).json({ message: 'Error retrieving resources.' });
  }
});

// Add resource
router.post('/:domain/resources', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { title, description, link, links, week, order } = req.body;

  // Accept either a links array or a single link string
  const resolvedLinks = Array.isArray(links) && links.length > 0
    ? links.filter(l => l && l.url)
    : link
      ? [{ label: 'Resource', url: link }]
      : [];

  if (!title || !week) {
    return res.status(400).json({ message: 'Title and week are required.' });
  }

  if (resolvedLinks.length === 0) {
    return res.status(400).json({ message: 'At least one link is required.' });
  }

  try {
    const newResource = await Resource.create({
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      domain: normalizeDomain(domain),
      title,
      description: description || '',
      link: resolvedLinks[0]?.url || '',
      links: resolvedLinks,
      week,
      order: Number(order) || 0,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newResource);
  } catch (error) {
    console.error('Failed to add resource:', error);
    res.status(500).json({ message: 'Failed to add resource.' });
  }
});

// Update resource
router.put('/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id, domain } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);
  const { title, description, link, links, week, order } = req.body;

  try {
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (week) updateData.week = week;
    if (order !== undefined) updateData.order = Number(order) || 0;
    updateData.domain = normalizeDomain(domain);

    // Handle links array
    if (Array.isArray(links)) {
      const resolvedLinks = links.filter(l => l && l.url);
      updateData.links = resolvedLinks;
      updateData.link = resolvedLinks[0]?.url || '';
    } else if (link) {
      updateData.link = link;
      updateData.links = [{ label: 'Resource', url: link }];
    }

    const updated = await Resource.findOneAndUpdate(
      { id, domain: { $in: equivalentDomains } },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update resource:', error);
    res.status(500).json({ message: 'Failed to update resource.' });
  }
});

// Delete resource
router.delete('/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id, domain } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);

  try {
    const deleted = await Resource.findOneAndDelete({ id, domain: { $in: equivalentDomains } });

    if (!deleted) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource.' });
  }
});

// Toggle week lock status
router.put('/:domain/weeks/:week/lock', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain, week } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);
  const { isLocked } = req.body;

  if (isLocked === undefined) {
    return res.status(400).json({ message: 'isLocked field is required.' });
  }

  try {
    const lock = await WeekLock.findOneAndUpdate(
      { domain: { $in: equivalentDomains }, week },
      { $set: { domain: normalizeDomain(domain), isLocked: Boolean(isLocked) } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Week lock status updated successfully.', lock });
  } catch (error) {
    console.error('Failed to update week lock status:', error);
    res.status(500).json({ message: 'Failed to update week lock status.' });
  }
});

// Toggle resource completion progress
router.put('/:domain/resources/:id/progress', authenticateToken, async (req, res) => {
  const { domain, id } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);
  const { completed } = req.body;

  if (completed === undefined) {
    return res.status(400).json({ message: 'completed field is required.' });
  }

  if (
    req.user.role === 'user' &&
    (!Array.isArray(req.user.domains) || !req.user.domains.some(userDomain => domainMatches(userDomain, domain)))
  ) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    // Find the resource
    const resource = await Resource.findOne({ id, domain: { $in: equivalentDomains } });
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found in this domain.' });
    }

    // Verify if week is locked
    const lock = await WeekLock.findOne({ domain: { $in: getEquivalentDomains(resource.domain) }, week: resource.week });
    const isWeekLocked = lock ? lock.isLocked : true;
    const isUserAdmin = req.user.role === 'super_admin' || (
      req.user.role === 'admin' &&
      Array.isArray(req.user.adminDomains) &&
      req.user.adminDomains.some(adminDomain => domainMatches(adminDomain, domain))
    );
    if (isWeekLocked && !isUserAdmin) {
      return res.status(403).json({ message: 'Cannot mark resource as completed in a locked week.' });
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId: req.user.id, resourceId: id },
      { $set: { completed: Boolean(completed), completedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ message: 'Progress updated successfully.', progress });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: 'Failed to update progress.' });
  }
});

export default router;
