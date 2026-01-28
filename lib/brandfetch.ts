const BRANDFETCH_CLIENT_ID = "1idYa6uaY9QLaZxDxo6";

export const getBrandLogo = (companyName: string): string => {
  // Map common company names to their domains
  const domainMap: Record<string, string> = {
    google: "google.com",
    apple: "apple.com",
    amazon: "amazon.com",
    meta: "meta.com",
    facebook: "meta.com",
    microsoft: "microsoft.com",
    netflix: "netflix.com",
    stripe: "stripe.com",
    airbnb: "airbnb.com",
    uber: "uber.com",
    salesforce: "salesforce.com",
    spotify: "spotify.com",
    twitter: "x.com",
    x: "x.com",
    linkedin: "linkedin.com",
    snap: "snap.com",
    snapchat: "snap.com",
    pinterest: "pinterest.com",
    dropbox: "dropbox.com",
    slack: "slack.com",
    zoom: "zoom.us",
    adobe: "adobe.com",
    oracle: "oracle.com",
    ibm: "ibm.com",
    intel: "intel.com",
    nvidia: "nvidia.com",
    paypal: "paypal.com",
    square: "squareup.com",
    block: "block.xyz",
    shopify: "shopify.com",
    doordash: "doordash.com",
    instacart: "instacart.com",
    lyft: "lyft.com",
    robinhood: "robinhood.com",
    coinbase: "coinbase.com",
    plaid: "plaid.com",
    figma: "figma.com",
    notion: "notion.so",
    asana: "asana.com",
    atlassian: "atlassian.com",
    twilio: "twilio.com",
    datadog: "datadoghq.com",
    snowflake: "snowflake.com",
    databricks: "databricks.com",
    palantir: "palantir.com",
    openai: "openai.com",
    anthropic: "anthropic.com",
    tiktok: "tiktok.com",
    perplexity: "perplexity.ai",
    xai: "x.ai"
  };

  const normalized = companyName.toLowerCase().trim();
  const domain = domainMap[normalized] || `${normalized}.com`;

  return `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`;
};

export const getBrandIcon = (companyName: string): string => {
  const domainMap: Record<string, string> = {
    google: "google.com",
    apple: "apple.com",
    amazon: "amazon.com",
    meta: "meta.com",
    microsoft: "microsoft.com",
    netflix: "netflix.com",
    stripe: "stripe.com",
    airbnb: "airbnb.com",
    uber: "uber.com",
    salesforce: "salesforce.com",
    spotify: "spotify.com",
    linkedin: "linkedin.com",
    pinterest: "pinterest.com",
    dropbox: "dropbox.com",
    slack: "slack.com",
    zoom: "zoom.us",
    adobe: "adobe.com",
    shopify: "shopify.com",
    doordash: "doordash.com",
    figma: "figma.com",
    notion: "notion.so",
    asana: "asana.com",
    atlassian: "atlassian.com",
    openai: "openai.com",
    anthropic: "anthropic.com",
    tiktok: "tiktok.com",
    perplexity: "perplexity.ai",
    xai: "x.ai"
  };

  const normalized = companyName.toLowerCase().trim();
  const domain = domainMap[normalized] || `${normalized}.com`;

  return `https://cdn.brandfetch.io/${domain}/icon?c=${BRANDFETCH_CLIENT_ID}`;
};
