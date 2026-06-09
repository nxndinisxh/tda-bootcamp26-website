export const VALID_DOMAINS = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];

const DOMAIN_GROUPS = [
  ['DSA'],
  ['DAV'],
  ['ML/DL', 'AI ML', 'Machine Learning', 'Deep Learning'],
  ['Gen & Agentic AI', 'Gen Ai'],
  ['WebDev']
];

const DOMAIN_LOOKUP = new Map(
  DOMAIN_GROUPS.flatMap(group => group.map(alias => [alias, group]))
);

export const normalizeDomain = (domain) => {
  if (!domain) return domain;
  return DOMAIN_LOOKUP.get(domain)?.[0] || domain;
};

export const getEquivalentDomains = (domain) => {
  if (!domain) return [];
  return DOMAIN_LOOKUP.get(domain) || [domain];
};

export const domainMatches = (leftDomain, rightDomain) => {
  if (!leftDomain || !rightDomain) return false;

  const leftGroup = getEquivalentDomains(leftDomain);
  const rightGroup = new Set(getEquivalentDomains(rightDomain));

  return leftGroup.some(domain => rightGroup.has(domain));
};
