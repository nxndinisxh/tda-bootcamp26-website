import express from 'express';
import Announcement from '../models/Announcement.js';
import { authenticateToken, requireDomainAccess } from '../middleware/auth.js';
import { domainMatches, getEquivalentDomains, normalizeDomain } from '../config/constants.js';

const router = express.Router();

// Get domain announcements
router.get('/:domain/announcements', authenticateToken, async (req, res) => {
  const { domain } = req.params;
  const equivalentDomains = getEquivalentDomains(domain);

  if (
    req.user.role === 'user' &&
    (!Array.isArray(req.user.domains) || !req.user.domains.some(userDomain => domainMatches(userDomain, domain)))
  ) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    const domainAnnouncements = await Announcement.find({ domain: { $in: equivalentDomains } }).sort({ date: -1 });
    res.json(domainAnnouncements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load announcements.' });
  }
});

// Create announcement
router.post('/:domain/announcements', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const newAnnouncement = await Announcement.create({
      id: `ann_${Date.now()}`,
      domain: normalizeDomain(domain),
      title,
      content,
      date: new Date().toISOString(),
      author: req.user.name
    });

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement.' });
  }
});

// Delete announcement
router.delete('/:domain/announcements/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Announcement.findOneAndDelete({ id, domain: { $in: getEquivalentDomains(req.params.domain) } });

    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});

export default router;
