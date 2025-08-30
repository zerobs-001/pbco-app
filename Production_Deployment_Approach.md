# Production Deployment Approach

## Executive Summary

This document outlines a comprehensive production deployment strategy for the Property Modeling Application, including CI/CD pipeline setup, testing protocols, security measures, and ongoing maintenance procedures.

## 1. Deployment Architecture

### 1.1 Recommended Platform: Vercel
**Primary Choice: Vercel**
- Native Next.js optimization
- Automatic deployments from Git
- Built-in CDN and edge functions
- Serverless architecture
- Easy environment management

**Alternative Options:**
- **AWS Amplify** - Full-stack AWS integration
- **Netlify** - JAMstack focused
- **Railway** - Simple container deployment
- **Self-hosted** - Docker on VPS/cloud instance

### 1.2 Environment Structure
```
Production (main branch) → vercel.com/your-app
Staging (staging branch) → staging-your-app.vercel.app  
Preview (feature branches) → auto-generated preview URLs
Development (local) → localhost:3002
```

## 2. CI/CD Pipeline Implementation

### 2.1 GitHub Actions Workflow

Create `.github/workflows/main.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
      
      - name: CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: typescript, javascript

  deploy-staging:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    steps:
      - name: Deploy to Staging
        # Vercel deployment step

  deploy-production:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        # Vercel deployment step
```

### 2.2 Branch Strategy

**Main Branches:**
- `main` → Production deployments
- `staging` → Staging environment for final testing
- `development` → Active development branch

**Feature Workflow:**
1. Create feature branch from `development`
2. Develop and test locally
3. Create PR to `development`
4. Code review and automated testing
5. Merge to `development`
6. Weekly/bi-weekly merge `development` → `staging`
7. UAT testing on staging
8. Merge `staging` → `main` for production

## 3. Testing Strategy

### 3.1 Automated Testing Layers

**1. Unit Tests (Jest + Testing Library)**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

Test files structure:
```
src/
  components/
    __tests__/
      PropertyModelingPage.test.tsx
      PurchaseSection.test.tsx
  lib/
    __tests__/
      calculations.test.ts
      purchaseReferences.test.ts
```

**2. Integration Tests**
- API route testing
- Database integration tests
- Component integration tests

**3. End-to-End Tests (Playwright)**
```bash
npm install -D @playwright/test
```

Critical user journeys:
- Property creation and editing
- Loan management workflows
- Purchase cost calculations
- Financial projections
- Data persistence

**4. Performance Tests**
- Lighthouse CI integration
- Core Web Vitals monitoring
- Load testing for concurrent users

### 3.2 Security Testing

**Static Analysis:**
- ESLint security rules
- CodeQL scanning
- Dependency vulnerability scanning

**Dynamic Testing:**
- OWASP ZAP security scanning
- Authentication/authorization testing
- Input validation testing
- SQL injection prevention testing

**Manual Security Review:**
- Code review checklist
- Security-focused peer reviews
- Penetration testing (quarterly)

## 4. Pre-Release Testing Protocol

### 4.1 Staging Environment Testing

**Functional Testing Checklist:**
- [ ] All property CRUD operations
- [ ] Loan calculations accuracy
- [ ] Purchase section calculations (stamp duty, LMI)
- [ ] Financial projections correctness
- [ ] Data persistence and retrieval
- [ ] User interface responsiveness
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

**Security Testing Checklist:**
- [ ] Authentication flows
- [ ] Authorization checks
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Sensitive data exposure

**Performance Testing Checklist:**
- [ ] Page load times < 3 seconds
- [ ] Database query performance
- [ ] Memory usage monitoring
- [ ] Concurrent user handling
- [ ] API response times

### 4.2 User Acceptance Testing (UAT)

**UAT Process:**
1. Deploy to staging environment
2. Create test scenarios document
3. Stakeholder testing (2-3 business days)
4. Bug triage and fixes
5. Regression testing
6. Sign-off documentation

## 5. Security Measures

### 5.1 Application Security

**Environment Variables:**
```bash
# Production environment variables
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

**Security Headers (next.config.js):**
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

### 5.2 Database Security

**Database Access:**
- Connection pooling and limits
- Read-only replicas for reporting
- Regular backups with encryption
- Row-level security (RLS) in Supabase

**Data Protection:**
- Personal data encryption at rest
- Secure data transmission (HTTPS/TLS)
- Regular security patching
- Access logging and monitoring

## 6. Monitoring and Observability

### 6.1 Application Monitoring

**Error Tracking:**
```bash
npm install @sentry/nextjs
```

**Performance Monitoring:**
- Vercel Analytics (built-in)
- Core Web Vitals tracking
- API response time monitoring
- Database performance metrics

**Health Checks:**
```typescript
// pages/api/health.ts
export default function handler(req, res) {
  // Database connectivity check
  // External service checks
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA 
  });
}
```

### 6.2 Alerting Strategy

**Critical Alerts:**
- Application down/error rate > 5%
- Database connection failures
- Authentication service issues
- Security incidents

**Warning Alerts:**
- High response times (> 5 seconds)
- Memory usage > 80%
- Unusual traffic patterns
- Failed deployment attempts

## 7. Release Process

### 7.1 Release Checklist

**Pre-Release (1 week before):**
- [ ] Feature freeze announcement
- [ ] Staging deployment
- [ ] Security scan completion
- [ ] Performance testing
- [ ] Documentation updates
- [ ] Changelog preparation

**Release Day:**
- [ ] Final staging tests
- [ ] Stakeholder approval
- [ ] Production deployment
- [ ] Smoke tests on production
- [ ] Monitor for 2 hours post-deployment
- [ ] Release announcement

**Post-Release (24-48 hours):**
- [ ] Performance metrics review
- [ ] Error rate monitoring
- [ ] User feedback collection
- [ ] Hotfix readiness

### 7.2 Rollback Strategy

**Automated Rollback Triggers:**
- Error rate > 10%
- Response time > 10 seconds
- Critical functionality failures

**Manual Rollback Process:**
1. Assess impact and severity
2. Decision to rollback (< 5 minutes)
3. Execute rollback via Vercel dashboard
4. Verify rollback success
5. Communication to stakeholders
6. Post-incident analysis

## 8. Environment Configuration

### 8.1 Vercel Deployment Setup

**1. Connect Repository:**
- Link GitHub repository to Vercel
- Configure auto-deployments
- Set up preview deployments

**2. Environment Variables:**
```bash
# Production
DATABASE_URL=postgresql://prod-db-url
NEXTAUTH_SECRET=production-secret
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key

# Staging
DATABASE_URL=postgresql://staging-db-url
NEXTAUTH_SECRET=staging-secret
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging-anon-key
```

**3. Build Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

### 8.2 Database Setup

**Production Database:**
- Supabase Pro plan or higher
- Automated backups (daily)
- Point-in-time recovery enabled
- Multiple availability zones

**Connection Pooling:**
```javascript
// lib/db.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: { 'x-my-custom-header': 'pbco-app' },
    },
  }
)
```

## 9. Documentation and Training

### 9.1 Technical Documentation

**Required Documents:**
- API documentation
- Database schema documentation
- Deployment runbooks
- Troubleshooting guides
- Security procedures

### 9.2 Team Training

**Development Team:**
- Deployment procedures training
- Security best practices workshop
- Monitoring and alerting training
- Incident response procedures

**Stakeholders:**
- UAT process training
- Feature acceptance criteria
- Escalation procedures

## 10. Maintenance and Updates

### 10.1 Regular Maintenance

**Weekly:**
- Dependency updates (automated PR)
- Security patch review
- Performance metrics review
- Backup verification

**Monthly:**
- Security vulnerability assessment
- Performance optimization review
- Database maintenance
- Documentation updates

**Quarterly:**
- Full security audit
- Disaster recovery testing
- Architecture review
- Scalability planning

### 10.2 Long-term Roadmap

**Phase 1 (Month 1-2): Initial Production**
- Basic CI/CD pipeline
- Core monitoring
- Manual testing processes

**Phase 2 (Month 3-4): Enhanced Automation**
- Comprehensive test suite
- Advanced monitoring
- Automated security scanning

**Phase 3 (Month 5-6): Optimization**
- Performance optimization
- Advanced security measures
- Multi-region deployment consideration

## Conclusion

This deployment approach ensures a robust, secure, and maintainable production environment for the Property Modeling Application. The strategy emphasizes automation, security, and thorough testing while maintaining flexibility for future enhancements.

## 11. Detailed Implementation Steps

### What Claude Can Help With vs. What You Need to Do

**Legend:**
- ✅ **Claude can do this** - I can create files, write code, run commands
- 🤝 **Claude can assist** - I can provide the exact steps/code, but you need to execute
- ❌ **You must do this** - Requires access to external services or web interfaces

#### Step-by-Step Assistance Breakdown:

**Step 1: Review and Approve**
- ✅ Help refine the approach document
- 🤝 Create RACI matrix template
- ❌ Stakeholder meetings and approvals

**Step 2: Vercel Setup**
- 🤝 Guide you through account creation
- ❌ Create Vercel account and connect GitHub
- ❌ Configure environment variables in Vercel dashboard
- ❌ Set up custom domain and DNS

**Step 3: CI/CD Pipeline**
- ✅ Create GitHub Actions workflow files
- ✅ Update package.json with required scripts
- ✅ Set up git branch structure
- ❌ Configure branch protection rules in GitHub
- ❌ Add GitHub Secrets (if needed)

**Step 4: Testing Setup**
- ✅ Install testing dependencies
- ✅ Create Jest configuration files
- ✅ Write sample unit tests
- ✅ Set up Playwright configuration
- ✅ Create testing checklists
- 🤝 Guide you through running tests

**Step 5: Monitoring Setup**
- 🤝 Provide configuration code for Sentry
- ❌ Create Sentry account
- ✅ Create health check API endpoint
- ❌ Set up UptimeRobot account
- ❌ Configure alerting in external services

**Step 6: Production Deployment**
- ✅ Help with pre-deployment verification
- 🤝 Guide deployment process
- ❌ Execute actual deployment
- ❌ Monitor production environment
- 🤝 Create user communication templates

---

### Phase 1: Immediate Setup (Week 1-2)

#### Step 1: Review and Approve Deployment Approach
**Duration:** 2-3 days
**Stakeholders:** Technical lead, project owner, security team (if applicable)
**Claude's Role:** 🤝 **Can assist** with document refinement and template creation

**Actions:**
1. **Review this document** with all stakeholders
2. **Identify any specific requirements** or constraints for your organization
3. **Approve the technology stack** (Vercel, GitHub Actions, Supabase)
4. **Define success criteria** for each deployment phase
5. **Assign roles and responsibilities**:
   - Deployment lead
   - Security reviewer
   - Testing coordinator
   - Stakeholder approval authority

**Deliverables:**
- [ ] Signed off deployment approach document
- [ ] RACI matrix for deployment responsibilities
- [ ] Technology stack approval
- [ ] Budget approval for hosting costs

---

#### Step 2: Set Up Vercel Account and Initial Deployment
**Duration:** 1-2 days
**Prerequisites:** GitHub repository access, domain name (optional)
**Claude's Role:** 🤝 **Can assist** with guidance and configuration, but you'll need to execute

**Actions:**

**2.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub account
3. Choose appropriate plan:
   - **Pro Plan ($20/month)** - Recommended for production
   - Includes: Password protection, advanced analytics, longer build times

**2.2 Import Your Project**
1. Click "New Project" in Vercel dashboard
2. Import from GitHub: `pbco-app`
3. Configure project settings:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm ci
   ```

**2.3 Set Up Environment Variables**
1. In Vercel project dashboard → Settings → Environment Variables
2. Add the following variables:

   **For Production Environment:**
   ```
   DATABASE_URL=your-production-supabase-url
   NEXTAUTH_SECRET=generate-strong-random-string-32-chars
   NEXTAUTH_URL=https://your-domain.vercel.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **How to generate NEXTAUTH_SECRET:**
   ```bash
   # In terminal, run:
   openssl rand -base64 32
   # Copy the output to NEXTAUTH_SECRET
   ```

**2.4 Configure Custom Domain (Optional)**
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL (automatic)

**2.5 Initial Deployment Test**
1. Make a small commit to your main branch
2. Verify auto-deployment triggers
3. Check deployment logs for errors
4. Test basic functionality on deployed URL

**Deliverables:**
- [ ] Working Vercel deployment
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] Deployment URL accessible and functional

---

#### Step 3: Implement CI/CD Pipeline
**Duration:** 3-5 days
**Prerequisites:** GitHub repository access, Vercel account
**Claude's Role:** ✅ **Can do most** - I can create all files and configurations, you just need GitHub web interface actions

**What I can do for you:**
- ✅ Create GitHub Actions workflow file
- ✅ Update package.json scripts
- ✅ Set up branch structure with git commands
- ❌ Configure branch protection rules (requires GitHub web interface)

**Actions:**

**3.1 Create GitHub Actions Workflow**
1. In your repository, create `.github/workflows/` directory
2. Create `ci-cd.yml` file:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, staging, development ]
  pull_request:
    branches: [ main, staging ]

env:
  NODE_VERSION: '18'

jobs:
  # Linting and type checking
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type checking
        run: npm run type-check

  # Security scanning
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level moderate

      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Build test
  build:
    runs-on: ubuntu-latest
    needs: [lint-and-type-check]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Check build output
        run: ls -la .next/

  # Unit tests (when implemented)
  test:
    runs-on: ubuntu-latest
    needs: [lint-and-type-check]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Uncomment when tests are implemented
      # - name: Run unit tests
      #   run: npm test

      - name: Placeholder for tests
        run: echo "Tests will be implemented in Step 4"

  # Deployment notification
  deploy-notification:
    runs-on: ubuntu-latest
    needs: [lint-and-type-check, security-scan, build, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deployment ready
        run: |
          echo "All checks passed. Deployment to production via Vercel will proceed."
          echo "Monitor deployment at: https://vercel.com/dashboard"
```

**3.2 Add Required Scripts to package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

**3.3 Configure Branch Protection Rules**
1. Go to GitHub → Settings → Branches
2. Add rule for `main` branch:
   ```
   ✓ Require a pull request before merging
   ✓ Require status checks to pass before merging
   ✓ Require branches to be up to date before merging
   ✓ Include administrators
   Required status checks:
     - lint-and-type-check
     - security-scan
     - build
     - test
   ```

**3.4 Set Up Branch Structure**
```bash
# Create staging branch
git checkout -b staging
git push -u origin staging

# Create development branch
git checkout -b development
git push -u origin development

# Return to main
git checkout main
```

**3.5 Configure Vercel for Multiple Environments**
1. In Vercel dashboard → Settings → Git
2. Configure branch deployments:
   ```
   Production Branch: main
   Preview Branches: All branches
   ```
3. Set up staging environment variables (same as production but with staging resources)

**Deliverables:**
- [ ] GitHub Actions workflow file created and working
- [ ] Branch protection rules configured
- [ ] Multiple branch structure established
- [ ] Vercel integration with GitHub working
- [ ] All CI/CD checks passing on sample commit

---

### Phase 2: Testing and Security (Week 3-4)

#### Step 4: Establish Testing Protocols
**Duration:** 5-7 days
**Prerequisites:** CI/CD pipeline working
**Claude's Role:** ✅ **Can do most** - I can set up all testing frameworks and write sample tests

**What I can do for you:**
- ✅ Install all testing dependencies
- ✅ Create Jest and Playwright configurations
- ✅ Write sample unit and E2E tests
- ✅ Create manual testing checklists
- 🤝 Guide you through running and interpreting test results

**Actions:**

**4.1 Set Up Jest for Unit Testing**
1. Install testing dependencies:
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

2. Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

3. Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
```

**4.2 Write Critical Unit Tests**
Create these test files:

`src/components/__tests__/PurchaseSection.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { PurchaseSection } from '../property/drawer-sections/PurchaseSection'

describe('PurchaseSection', () => {
  const mockData = {
    inputs: {
      propertyAddress: '123 Test St',
      state: 'NSW',
      purchasePrice: 500000,
      // ... other required fields
    },
    paymentItems: []
  }

  test('renders purchase section with required fields', () => {
    render(<PurchaseSection data={mockData} onChange={jest.fn()} />)
    
    expect(screen.getByText('A) Inputs')).toBeInTheDocument()
    expect(screen.getByText('Property Address')).toBeInTheDocument()
  })

  test('calculates stamp duty correctly for NSW', () => {
    // Test stamp duty calculation logic
  })

  test('calculates LMI correctly based on LVR', () => {
    // Test LMI calculation logic
  })
})
```

`src/lib/__tests__/purchaseReferences.test.ts`:
```typescript
import { calculateStampDuty, calculateLMI } from '../constants/purchaseReferences'

describe('Purchase Calculations', () => {
  describe('calculateStampDuty', () => {
    test('calculates NSW stamp duty correctly', () => {
      expect(calculateStampDuty('NSW', 500000, true)).toBeCloseTo(21330, 0)
    })

    test('returns 0 for invalid state', () => {
      expect(calculateStampDuty('INVALID', 500000, true)).toBe(0)
    })
  })

  describe('calculateLMI', () => {
    test('returns 0 for LVR <= 80%', () => {
      expect(calculateLMI(400000, 0.8)).toBe(0)
    })

    test('calculates LMI for high LVR', () => {
      expect(calculateLMI(450000, 0.9)).toBeGreaterThan(0)
    })
  })
})
```

**4.3 Set Up Playwright for E2E Testing**
1. Install Playwright:
```bash
npm init playwright@latest
```

2. Configure `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

3. Create `e2e/property-modeling.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('property modeling page loads correctly', async ({ page }) => {
  await page.goto('/property/test-property-id/model');
  
  // Wait for page to load
  await expect(page.locator('h1')).toContainText('Property Modeling');
  
  // Test navigation panel
  await expect(page.locator('[data-testid="navigation-panel"]')).toBeVisible();
  
  // Test purchase section
  await page.click('[data-testid="nav-purchase"]');
  await expect(page.locator('text=A) Inputs')).toBeVisible();
});

test('purchase calculations work correctly', async ({ page }) => {
  await page.goto('/property/test-property-id/model');
  
  // Navigate to purchase section
  await page.click('[data-testid="nav-purchase"]');
  
  // Fill in purchase price
  await page.fill('[data-testid="purchase-price"]', '500000');
  
  // Fill in state
  await page.selectOption('[data-testid="state-select"]', 'NSW');
  
  // Verify stamp duty calculation appears
  await expect(page.locator('[data-testid="stamp-duty-amount"]')).toContainText('$');
});
```

**4.4 Create Manual Testing Checklists**
Create `testing-checklists.md`:

```markdown
# Manual Testing Checklist

## Pre-Release Testing Protocol

### Functional Testing
- [ ] Property CRUD operations
  - [ ] Create new property
  - [ ] Edit property details
  - [ ] Delete property
  - [ ] View property list
  
- [ ] Purchase Section
  - [ ] All input fields accept valid data
  - [ ] Calculations update in real-time
  - [ ] State-based stamp duty calculation
  - [ ] LVR-based LMI calculation
  - [ ] Date calculations work correctly
  
- [ ] Loan Management
  - [ ] Add/edit/delete loans
  - [ ] Interest rate calculations
  - [ ] Loan term adjustments
  
- [ ] Financial Projections
  - [ ] Yearly projections generate
  - [ ] Growth assumptions apply correctly
  - [ ] Cash flow calculations accurate

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Responsiveness
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Tablet view
- [ ] All functions work on touch devices

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Large property lists load quickly
- [ ] No memory leaks during extended use
- [ ] Calculations complete quickly
```

**Deliverables:**
- [ ] Jest testing framework configured and working
- [ ] Unit tests written for critical functions
- [ ] Playwright E2E testing configured
- [ ] E2E tests written for key user journeys
- [ ] Manual testing checklist created
- [ ] All tests passing in CI/CD pipeline

---

#### Step 5: Configure Monitoring and Alerting
**Duration:** 3-4 days
**Prerequisites:** Application deployed to production
**Claude's Role:** 🤝 **Can assist** - I can create code and configurations, but you'll need to set up external accounts

**What I can do for you:**
- ✅ Create health check API endpoint
- ✅ Provide Sentry configuration code
- ✅ Set up Vercel Analytics integration
- ❌ Create external service accounts (Sentry, UptimeRobot)
- ❌ Configure alerting in external services

**Actions:**

**5.1 Set Up Error Monitoring with Sentry**
1. Create Sentry account at [sentry.io](https://sentry.io)
2. Create new project for Next.js
3. Install Sentry:
```bash
npm install --save @sentry/nextjs
```

4. Run Sentry wizard:
```bash
npx @sentry/wizard -i nextjs
```

5. Configure `sentry.client.config.js`:
```javascript
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  // Add user context
  beforeSend(event) {
    // Filter out sensitive data
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('password') || error?.value?.includes('token')) {
        return null; // Don't send sensitive errors
      }
    }
    return event;
  },
});
```

6. Add Sentry DSN to environment variables:
```
SENTRY_DSN=your-sentry-dsn-from-project-settings
```

**5.2 Set Up Application Performance Monitoring**
1. Enable Vercel Analytics:
   - Go to Vercel dashboard → Analytics → Enable
   - Add to your app:
   ```bash
   npm install @vercel/analytics
   ```

2. Add to `pages/_app.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

**5.3 Create Health Check Endpoint**
Create `pages/api/health.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);

    if (error) throw error;

    // If we get here, everything is working
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
}
```

**5.4 Set Up Uptime Monitoring**
1. Create account at [UptimeRobot](https://uptimerobot.com) (free plan)
2. Add HTTP monitor for your production URL
3. Add monitor for health check endpoint: `https://yourdomain.com/api/health`
4. Configure alert contacts (email, SMS)
5. Set check interval to 5 minutes

**5.5 Set Up Log Monitoring**
1. Vercel automatically captures logs
2. Configure log retention in Vercel dashboard
3. Set up log alerts for error patterns:
   - Database connection errors
   - Authentication failures
   - API rate limit exceeded
   - Unexpected application crashes

**5.6 Create Alerting Rules**
Configure alerts for:
- **Critical (immediate notification):**
  - Site down (response code 5xx)
  - Health check failing
  - Error rate > 5%
  - Database connectivity lost

- **Warning (notification within 15 minutes):**
  - Response time > 5 seconds
  - Memory usage > 80%
  - Unusual traffic patterns
  - Authentication error spike

**Deliverables:**
- [ ] Sentry error monitoring configured
- [ ] Vercel Analytics enabled
- [ ] Health check endpoint created and tested
- [ ] Uptime monitoring configured
- [ ] Log monitoring and alerting set up
- [ ] Alert notification channels configured
- [ ] Monitoring dashboard accessible to team

---

### Phase 3: Production Launch (Week 5-6)

#### Step 6: Conduct Initial Production Deployment
**Duration:** 4-7 days
**Prerequisites:** All previous steps completed, testing passed
**Claude's Role:** 🤝 **Can assist** - I can help with verification and guidance, but you'll execute the deployment

**What I can do for you:**
- ✅ Help with pre-deployment verification commands
- ✅ Create user communication templates
- ✅ Provide monitoring and troubleshooting guidance
- ❌ Execute actual production deployment
- ❌ Monitor live production environment
- ❌ Handle real user communications

**Actions:**

**6.1 Pre-Production Checklist (Day 1)**
- [ ] All tests passing in CI/CD
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks met
- [ ] Manual testing checklist completed
- [ ] Stakeholder sign-off obtained
- [ ] Rollback plan documented
- [ ] Team notified of deployment schedule
- [ ] Support contacts identified

**6.2 Production Environment Setup (Day 1-2)**
1. **Database Production Setup:**
   - Upgrade Supabase to production tier
   - Enable automated backups
   - Configure point-in-time recovery
   - Set up read replicas (if needed)
   - Test database performance under load

2. **Domain and SSL Configuration:**
   ```bash
   # If using custom domain
   # 1. Configure DNS records as shown in Vercel
   # 2. Verify SSL certificate is active
   # 3. Test HTTPS enforcement
   # 4. Configure redirects (www → non-www or vice versa)
   ```

3. **Environment Variables Verification:**
   - Double-check all production environment variables
   - Ensure no development/staging URLs or keys
   - Verify API keys have appropriate permissions
   - Test external service connections

**6.3 Deployment Execution (Day 3)**
1. **Final Pre-Deployment Verification:**
   ```bash
   # Run final checks locally
   npm run build
   npm run type-check
   npm run lint
   # If tests exist: npm test
   ```

2. **Deploy to Production:**
   - Merge final changes to main branch
   - Monitor Vercel deployment dashboard
   - Wait for deployment completion
   - Verify deployment success in logs

3. **Post-Deployment Verification (within 30 minutes):**
   - [ ] Site loads correctly at production URL
   - [ ] All major pages accessible
   - [ ] User authentication works
   - [ ] Database connections successful
   - [ ] API endpoints responding
   - [ ] Calculations working correctly
   - [ ] No JavaScript errors in console
   - [ ] Mobile version functional

**6.4 Production Monitoring (Day 3-7)**
1. **Immediate Monitoring (First 2 hours):**
   - Watch error rates in Sentry
   - Monitor response times in Vercel Analytics
   - Check server logs for warnings
   - Monitor database performance
   - Verify uptime monitoring working

2. **24-Hour Monitoring:**
   - Review error patterns
   - Analyze user behavior
   - Check performance under real load
   - Verify backup systems
   - Monitor security alerts

3. **Week 1 Monitoring:**
   - Daily error rate review
   - Performance optimization opportunities
   - User feedback collection
   - Security incident monitoring
   - Capacity planning assessment

**6.5 User Communication and Training**
1. **Stakeholder Notification:**
   ```
   Subject: Property Modeling App - Production Launch Complete

   The Property Modeling Application is now live at: https://your-domain.com

   Key Features Available:
   - Property portfolio management
   - Comprehensive purchase cost tracking
   - Financial projections and modeling
   - Loan management and calculations

   Support Contact: [your-email]
   Documentation: [link to user guides]
   
   Please report any issues immediately.
   ```

2. **User Onboarding:**
   - Create quick start guide
   - Schedule training sessions if needed
   - Set up user feedback collection
   - Prepare FAQ document

**6.6 Post-Launch Activities (Week 2)**
1. **Performance Review:**
   - Analyze first week metrics
   - Identify optimization opportunities
   - Plan performance improvements
   - Update capacity forecasts

2. **Security Assessment:**
   - Review security logs
   - Check for vulnerability attempts
   - Validate access controls working
   - Plan security improvements

3. **User Feedback Integration:**
   - Collect and analyze user feedback
   - Prioritize bug fixes and enhancements
   - Plan next iteration features
   - Update product roadmap

**Deliverables:**
- [ ] Production environment fully operational
- [ ] All systems monitored and alerting properly
- [ ] Users successfully onboarded
- [ ] Performance benchmarks documented
- [ ] Security posture verified
- [ ] Support processes operational
- [ ] Next iteration planned

---

## Success Criteria and Metrics

### Week 1-2 Success Metrics:
- [ ] CI/CD pipeline success rate > 95%
- [ ] All critical automated tests passing
- [ ] Deployment time < 5 minutes
- [ ] Zero critical security vulnerabilities

### Week 3-4 Success Metrics:
- [ ] Test coverage > 70% for critical functions
- [ ] E2E tests covering major user journeys
- [ ] Manual testing checklist 100% complete
- [ ] Monitoring detecting issues within 2 minutes

### Week 5-6 Success Metrics:
- [ ] Production uptime > 99.9%
- [ ] Page load times < 3 seconds
- [ ] Zero data loss incidents
- [ ] User satisfaction > 80% (if surveyed)
- [ ] Error rate < 1%

## Budget Considerations

**Monthly Recurring Costs:**
- Vercel Pro: $20/month
- Supabase Pro: $25/month  
- Sentry (10k errors/month): $26/month
- UptimeRobot Pro: $7/month
- **Total: ~$78/month**

**One-time Setup Costs:**
- Domain name: $12/year
- SSL certificate: Free (via Vercel)
- Development time: [Your hourly rate × estimated hours]

This detailed plan provides specific, actionable steps for each phase of your production deployment. Each step includes clear deliverables and success criteria to ensure you're making progress toward a stable, secure, and maintainable production environment.