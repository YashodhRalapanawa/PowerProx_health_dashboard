/**
 * Monitored sites configuration.
 * Each site object contains:
 * - name: Display name of the service/portal
 * - url: Target URL used for health status checks
 * - summary: Description of the service purpose
 */
const sites = [
  {
    name: 'PowerProx',
    url: 'https://powerprox.sltidc.lk:8085/',
    summary: 'Main portal for PowerProx services and generator management'
  },
  {
    name: 'PowerZenith',
    url: 'http://124.43.181.243:3000/login',
    summary: 'Backend service for power management monitoring'
  },
  {
    name: 'Solar Dashboard',
    url: 'http://124.43.181.243:5173/',
    summary: 'Monitors solar panel installations across SLT sites'
  },
  {
    name: 'Asset Overview',
    url: 'http://124.43.181.243:8093/',
    summary: 'SLT Telecom asset tracking for generators, transformers, UPS'
  },
  {
    name: 'Fault Logging System',
    url: 'https://sltpowerprox-ae473.web.app/',
    summary: 'Fault logging and tracking system'
  }
];

export default sites;
