import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — App Templates Catalog', () => {
  let memRepo: MemoryRepository;
  let adminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    adminToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      name: 'Kavinbalaji S K',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists app templates catalog', async () => {
    const res = await request(app)
      .get('/api/v1/templates')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Creates, updates, toggles publish/featured, and deletes an app template', async () => {
    // Create template
    const createRes = await request(app)
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Executive Minimalist Bio',
        category: 'biolink',
        description: 'Single-page biolink template for senior consultants and founders.',
        tier: 'Pro',
        status: 'Draft',
        isFeatured: false,
        tags: ['Minimal', 'Biolink', 'Executive'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.id).toBeDefined();

    const templateId = createRes.body.data.id;

    // Update template
    const updateRes = await request(app)
      .patch(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description for executive biolink.' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Updated description for executive biolink.');

    // Toggle publish
    const publishRes = await request(app)
      .post(`/api/v1/templates/${templateId}/toggle-publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('Published');

    // Toggle featured
    const featuredRes = await request(app)
      .post(`/api/v1/templates/${templateId}/toggle-featured`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(featuredRes.status).toBe(200);
    expect(featuredRes.body.data.isFeatured).toBe(true);

    // Delete template
    const deleteRes = await request(app)
      .delete(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
