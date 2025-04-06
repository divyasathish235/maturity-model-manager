import bcrypt from 'bcrypt';
import { db, initializeDatabase } from '../database/db';
import { UserRole, CampaignStatus, ServiceType, EvidenceType } from '../models';

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Create default users
    const userIds = await createDefaultUsers();
    
    // Create measurement categories
    const categoryIds = await createMeasurementCategories();
    
    // Create sample teams
    const teamIds = await createSampleTeams(userIds);
    
    // Create sample services
    const serviceIds = await createSampleServices(userIds, teamIds);
    
    // Create sample maturity models
    const modelIds = await createSampleMaturityModels(userIds);
    
    // Create maturity level rules
    await createMaturityLevelRules(modelIds);
    
    // Create sample measurements
    await createSampleMeasurements(modelIds, categoryIds);
    
    // Create the Hackathon 2025 campaign
    await createHackathonCampaign(userIds[0], modelIds[0], serviceIds);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close();
  }
}

/**
 * Create default users
 * @returns Array of user IDs
 */
async function createDefaultUsers(): Promise<number[]> {
  console.log('Creating default users...');
  
  const users = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      email: 'admin@example.com',
      role: UserRole.ADMIN
    },
    {
      username: 'teamowner',
      password: await bcrypt.hash('owner123', 10),
      email: 'owner@example.com',
      role: UserRole.TEAM_OWNER
    },
    {
      username: 'teammember',
      password: await bcrypt.hash('member123', 10),
      email: 'member@example.com',
      role: UserRole.TEAM_MEMBER
    }
  ];
  
  const userIds: number[] = [];
  
  for (const user of users) {
    const id = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        [user.username, user.password, user.email, user.role],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
    
    userIds.push(id);
  }
  
  console.log('Default users created');
  return userIds;
}

/**
 * Create measurement categories
 * @returns Object with category names as keys and IDs as values
 */
async function createMeasurementCategories(): Promise<Record<string, number>> {
  console.log('Creating measurement categories...');
  
  const categories = [
    {
      name: 'Service Reliability',
      description: 'Measures related to service reliability and availability'
    },
    {
      name: 'Performance and Scalability',
      description: 'Measures related to performance and scalability of services'
    },
    {
      name: 'Change Management',
      description: 'Measures related to change management processes'
    },
    {
      name: 'Security and Compliance',
      description: 'Measures related to security and compliance requirements'
    },
    {
      name: 'Observability and Monitoring',
      description: 'Measures related to observability and monitoring capabilities'
    },
    {
      name: 'Documentation Management',
      description: 'Measures related to documentation management'
    }
  ];
  
  const categoryIds: Record<string, number> = {};
  
  for (const category of categories) {
    const id = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO measurement_categories (name, description) VALUES (?, ?)',
        [category.name, category.description],
        function(err) {
          if (err) {
            console.error('Error creating category:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
    
    categoryIds[category.name] = id;
  }
  
  console.log('Measurement categories created');
  return categoryIds;
}

/**
 * Create sample teams
 * @param userIds Array of user IDs
 * @returns Array of team IDs
 */
async function createSampleTeams(userIds: number[]): Promise<number[]> {
  console.log('Creating sample teams...');
  
  const teams = [
    {
      name: 'Platform Team',
      owner_id: userIds[0], // admin
      description: 'Team responsible for platform services'
    },
    {
      name: 'Frontend Team',
      owner_id: userIds[1], // teamowner
      description: 'Team responsible for frontend applications'
    },
    {
      name: 'Backend Team',
      owner_id: userIds[1], // teamowner
      description: 'Team responsible for backend services'
    }
  ];
  
  const teamIds: number[] = [];
  
  for (const team of teams) {
    const id = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO teams (name, owner_id, description) VALUES (?, ?, ?)',
        [team.name, team.owner_id, team.description],
        function(err) {
          if (err) {
            console.error('Error creating team:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
    
    teamIds.push(id);
  }
  
  console.log('Sample teams created');
  return teamIds;
}

/**
 * Create sample services
 * @param userIds Array of user IDs
 * @param teamIds Array of team IDs
 * @returns Array of service IDs
 */
async function createSampleServices(userIds: number[], teamIds: number[]): Promise<number[]> {
  console.log('Creating sample services...');
  
  const services = [
    {
      name: 'API Gateway',
      owner_id: userIds[0], // admin
      team_id: teamIds[0], // Platform Team
      description: 'API Gateway service for routing requests',
      service_type: ServiceType.API_SERVICE,
      resource_location: 'https://github.com/example/api-gateway'
    },
    {
      name: 'User Authentication Service',
      owner_id: userIds[0], // admin
      team_id: teamIds[0], // Platform Team
      description: 'Service for user authentication',
      service_type: ServiceType.API_SERVICE,
      resource_location: 'https://github.com/example/auth-service'
    },
    {
      name: 'Customer Portal',
      owner_id: userIds[1], // teamowner
      team_id: teamIds[1], // Frontend Team
      description: 'Customer-facing web portal',
      service_type: ServiceType.UI_APPLICATION,
      resource_location: 'https://github.com/example/customer-portal'
    },
    {
      name: 'Admin Dashboard',
      owner_id: userIds[1], // teamowner
      team_id: teamIds[1], // Frontend Team
      description: 'Admin dashboard application',
      service_type: ServiceType.UI_APPLICATION,
      resource_location: 'https://github.com/example/admin-dashboard'
    },
    {
      name: 'Payment Processing Service',
      owner_id: userIds[1], // teamowner
      team_id: teamIds[2], // Backend Team
      description: 'Service for processing payments',
      service_type: ServiceType.API_SERVICE,
      resource_location: 'https://github.com/example/payment-service'
    },
    {
      name: 'Notification Service',
      owner_id: userIds[1], // teamowner
      team_id: teamIds[2], // Backend Team
      description: 'Service for sending notifications',
      service_type: ServiceType.API_SERVICE,
      resource_location: 'https://github.com/example/notification-service'
    }
  ];
  
  const serviceIds: number[] = [];
  
  for (const service of services) {
    const id = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO services (name, owner_id, team_id, description, service_type, resource_location) VALUES (?, ?, ?, ?, ?, ?)',
        [service.name, service.owner_id, service.team_id, service.description, service.service_type, service.resource_location],
        function(err) {
          if (err) {
            console.error('Error creating service:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
    
    serviceIds.push(id);
  }
  
  console.log('Sample services created');
  return serviceIds;
}

/**
 * Create sample maturity models
 * @param userIds Array of user IDs
 * @returns Array of maturity model IDs
 */
async function createSampleMaturityModels(userIds: number[]): Promise<number[]> {
  console.log('Creating sample maturity models...');
  
  const models = [
    {
      name: 'Operational Excellence',
      owner_id: userIds[0], // admin
      description: 'Maturity model for operational excellence focusing on reliability, monitoring, and automation'
    },
    {
      name: 'Security Compliance',
      owner_id: userIds[0], // admin
      description: 'Maturity model for security compliance'
    },
    {
      name: 'Performance Optimization',
      owner_id: userIds[0], // admin
      description: 'Maturity model for performance optimization'
    }
  ];
  
  const modelIds: number[] = [];
  
  for (const model of models) {
    const id = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO maturity_models (name, owner_id, description) VALUES (?, ?, ?)',
        [model.name, model.owner_id, model.description],
        function(err) {
          if (err) {
            console.error('Error creating maturity model:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
    
    modelIds.push(id);
  }
  
  console.log('Sample maturity models created');
  return modelIds;
}

/**
 * Create maturity level rules
 * @param modelIds Array of maturity model IDs
 */
async function createMaturityLevelRules(modelIds: number[]) {
  console.log('Creating maturity level rules...');
  
  // Create the same rules for all models
  for (const modelId of modelIds) {
    const rules = [
      {
        maturity_model_id: modelId,
        level: 0,
        min_percentage: 0,
        max_percentage: 24.99
      },
      {
        maturity_model_id: modelId,
        level: 1,
        min_percentage: 25,
        max_percentage: 49.99
      },
      {
        maturity_model_id: modelId,
        level: 2,
        min_percentage: 50,
        max_percentage: 74.99
      },
      {
        maturity_model_id: modelId,
        level: 3,
        min_percentage: 75,
        max_percentage: 99.99
      },
      {
        maturity_model_id: modelId,
        level: 4,
        min_percentage: 100,
        max_percentage: 100
      }
    ];
    
    for (const rule of rules) {
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO maturity_level_rules (maturity_model_id, level, min_percentage, max_percentage) VALUES (?, ?, ?, ?)',
          [rule.maturity_model_id, rule.level, rule.min_percentage, rule.max_percentage],
          (err) => {
            if (err) {
              console.error('Error creating maturity level rule:', err);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }
  }
  
  console.log('Maturity level rules created');
}

/**
 * Create sample measurements
 * @param modelIds Array of maturity model IDs
 * @param categoryIds Object with category names as keys and IDs as values
 */
async function createSampleMeasurements(modelIds: number[], categoryIds: Record<string, number>) {
  console.log('Creating sample measurements...');
  
  // Create measurements for the Operational Excellence model (index 0)
  const operationalExcellenceMeasurements = [
    {
      name: 'Has centralized logging',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Observability and Monitoring'],
      description: 'Service logs are centralized and easily accessible',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://logging.example.com/service-logs'
    },
    {
      name: 'Has infrastructure metrics published',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Observability and Monitoring'],
      description: 'Service publishes infrastructure metrics to a central monitoring system',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://metrics.example.com/service-metrics'
    },
    {
      name: 'Has automated deployment pipeline',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Change Management'],
      description: 'Service has an automated deployment pipeline',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://ci.example.com/service-pipeline'
    },
    {
      name: 'Has documented API',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Documentation Management'],
      description: 'Service has documented API',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://docs.example.com/service-api'
    },
    {
      name: 'Has automated tests',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Change Management'],
      description: 'Service has automated tests with good coverage',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://ci.example.com/service-tests'
    },
    {
      name: 'Has SLOs defined',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Service Reliability'],
      description: 'Service has defined Service Level Objectives',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'SLO Documentation'
    },
    {
      name: 'Has error budget policy',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Service Reliability'],
      description: 'Service has defined error budget policy',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'Error Budget Policy Document'
    },
    {
      name: 'Has auto-scaling configured',
      maturity_model_id: modelIds[0],
      category_id: categoryIds['Performance and Scalability'],
      description: 'Service has auto-scaling configured',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'Auto-scaling Configuration Document'
    }
  ];
  
  // Create measurements for the Security Compliance model (index 1)
  const securityComplianceMeasurements = [
    {
      name: 'Has security scanning in CI/CD',
      maturity_model_id: modelIds[1],
      category_id: categoryIds['Security and Compliance'],
      description: 'Service has security scanning in CI/CD pipeline',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://ci.example.com/service-security-scan'
    },
    {
      name: 'Has vulnerability management process',
      maturity_model_id: modelIds[1],
      category_id: categoryIds['Security and Compliance'],
      description: 'Service has a vulnerability management process',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'Vulnerability Management Process Document'
    },
    {
      name: 'Has access control documentation',
      maturity_model_id: modelIds[1],
      category_id: categoryIds['Documentation Management'],
      description: 'Service has access control documentation',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'Access Control Documentation'
    }
  ];
  
  // Create measurements for the Performance Optimization model (index 2)
  const performanceOptimizationMeasurements = [
    {
      name: 'Has performance testing in CI/CD',
      maturity_model_id: modelIds[2],
      category_id: categoryIds['Performance and Scalability'],
      description: 'Service has performance testing in CI/CD pipeline',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://ci.example.com/service-performance-test'
    },
    {
      name: 'Has auto-scaling configuration',
      maturity_model_id: modelIds[2],
      category_id: categoryIds['Performance and Scalability'],
      description: 'Service has auto-scaling configuration',
      evidence_type: EvidenceType.DOCUMENT,
      sample_evidence: 'Auto-scaling Configuration Document'
    },
    {
      name: 'Has performance metrics dashboard',
      maturity_model_id: modelIds[2],
      category_id: categoryIds['Observability and Monitoring'],
      description: 'Service has a performance metrics dashboard',
      evidence_type: EvidenceType.URL,
      sample_evidence: 'https://metrics.example.com/service-performance'
    }
  ];
  
  const allMeasurements = [
    ...operationalExcellenceMeasurements,
    ...securityComplianceMeasurements,
    ...performanceOptimizationMeasurements
  ];
  
  for (const measurement of allMeasurements) {
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO measurements (name, maturity_model_id, category_id, description, evidence_type, sample_evidence) VALUES (?, ?, ?, ?, ?, ?)',
        [measurement.name, measurement.maturity_model_id, measurement.category_id, measurement.description, measurement.evidence_type, measurement.sample_evidence],
        (err) => {
          if (err) {
            console.error('Error creating measurement:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
  
  console.log('Sample measurements created');
}

/**
 * Create the Hackathon 2025 campaign
 * @param adminId Admin user ID
 * @param operationalExcellenceModelId Operational Excellence model ID
 * @param serviceIds Array of service IDs
 */
async function createHackathonCampaign(adminId: number, operationalExcellenceModelId: number, serviceIds: number[]) {
  console.log('Creating Hackathon 2025 campaign...');
  
  // Create campaign
  const campaignId = await new Promise<number>((resolve, reject) => {
    db.run(
      `INSERT INTO campaigns (name, maturity_model_id, start_date, end_date, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Hackathon 2025 Kona Kona Koding', 
        operationalExcellenceModelId, 
        new Date().toISOString(), 
        new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), 
        CampaignStatus.ACTIVE, 
        adminId
      ],
      function(err) {
        if (err) {
          console.error('Error creating campaign:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
  
  // Get measurements for the Operational Excellence model
  const measurements = await new Promise<any[]>((resolve, reject) => {
    db.all(
      'SELECT id FROM measurements WHERE maturity_model_id = ?',
      [operationalExcellenceModelId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching measurements:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
  
  // Add all services as participants
  for (const serviceId of serviceIds) {
    // Add participant
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO campaign_participants (campaign_id, service_id) VALUES (?, ?)',
        [campaignId, serviceId],
        (err) => {
          if (err) {
            console.error('Error adding participant:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
    
    // Create measurement evaluations for each measurement
    for (const measurement of measurements) {
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO measurement_evaluations 
           (campaign_id, service_id, measurement_id, status) 
           VALUES (?, ?, ?, 'Not Implemented')`,
          [campaignId, serviceId, measurement.id],
          (err) => {
            if (err) {
              console.error('Error creating measurement evaluation:', err);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }
  }
  
  console.log('Hackathon 2025 campaign created');
}

// Run the seed function
seedDatabase();