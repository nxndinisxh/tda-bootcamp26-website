import express from 'express';
import Resource from '../models/Resource.js';
import { authenticateToken, requireDomainAccess } from '../middleware/auth.js';

const router = express.Router();

// Get domain resources
router.get('/:domain/resources', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  if (req.user.role === 'user' && !req.user.domains.includes(domain)) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    const domainResources = await Resource.find({ domain });
    res.json(domainResources);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resources.' });
  }
});

// Add resource
router.post('/:domain/resources', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { title, description, link, week } = req.body;

  if (!title || !link || !week) {
    return res.status(400).json({ message: 'Title, link, and week are required.' });
  }

  try {
    const newResource = await Resource.create({
      id: `res_${Date.now()}`,
      domain,
      title,
      description: description || '',
      link,
      week,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add resource.' });
  }
});

// Update resource
router.put('/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;
  const { title, description, link, week } = req.body;

  try {
    const updated = await Resource.findOneAndUpdate(
      { id },
      {
        $set: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(link && { link }),
          ...(week && { week })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resource.' });
  }
});

// Delete resource
router.delete('/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Resource.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource.' });
  }
});

export default router;
