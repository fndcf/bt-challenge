/**
 * Converte texto para slug URL-friendly
 *
 * Exemplos:
 * "Arena Praia do Forte" → "arena-praia-do-forte"
 * "Tênis Club São Paulo" → "tenis-club-sao-paulo"
 * "Beach Tennis 123!" → "beach-tennis-123"
 */
export function slugify(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Remove acentos
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove caracteres especiais
      .replace(/[^\w\s-]/g, "")
      // Substitui espaços e underscores por hífens
      .replace(/[\s_]+/g, "-")
      // Remove hífens múltiplos
      .replace(/-+/g, "-")
      // Remove hífens do início e fim
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Gera slug único adicionando número incremental se necessário
 *
 * Exemplos:
 * "Arena ABC" (disponível) → "arena-abc"
 * "Arena ABC" (já existe) → "arena-abc-2"
 * "Arena ABC" (existe 2 e 3) → "arena-abc-4"
 */
export async function generateUniqueSlug(
  baseText: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(baseText);
  let counter = 1;

  // Verifica se slug já existe
  while (await checkExists(slug)) {
    counter++;
    slug = `${slugify(baseText)}-${counter}`;
  }

  return slug;
}
