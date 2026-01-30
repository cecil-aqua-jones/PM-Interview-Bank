/**
 * SEOHead Component
 * =================
 * Reusable component for injecting JSON-LD structured data into pages.
 * Use this component to add Schema.org structured data for rich search results.
 *
 * Usage:
 *   import { SEOHead } from "@/components/SEOHead";
 *   import { generateOrganizationSchema, generateFAQSchema } from "@/lib/seo";
 *
 *   <SEOHead schemas={[
 *     generateOrganizationSchema(),
 *     generateFAQSchema(faqs)
 *   ]} />
 */

interface SEOHeadProps {
  /** Array of JSON-LD schema objects */
  schemas: object[];
  /** Optional: Combine schemas into a @graph format */
  useGraph?: boolean;
}

/**
 * Inject JSON-LD structured data into the page head
 */
export function SEOHead({ schemas, useGraph = false }: SEOHeadProps) {
  if (!schemas || schemas.length === 0) {
    return null;
  }

  if (useGraph) {
    // Combine all schemas into a single @graph
    const graphSchema = {
      "@context": "https://schema.org",
      "@graph": schemas.map((schema) => {
        // Remove @context from individual schemas when combining
        const schemaObj = schema as Record<string, unknown>;
        const { "@context": _, ...rest } = schemaObj;
        return rest;
      }),
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }}
      />
    );
  }

  // Render each schema as a separate script tag
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default SEOHead;
