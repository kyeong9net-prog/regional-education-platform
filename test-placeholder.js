function analyzePlaceholder(placeholder) {
  const cleaned = placeholder.replace(/^\{\{|\}\}$/g, '');

  if (!cleaned.includes('_')) {
    return { type: cleaned, category: null, index: null };
  }

  const parts = cleaned.split('_');
  const lastPart = parts[parts.length - 1];
  const index = /^\d+$/.test(lastPart) ? parseInt(lastPart) : null;

  let type = null;
  let category = null;

  if (cleaned.includes('_IMAGE_')) {
    type = 'IMAGE';
    category = cleaned.split('_IMAGE_')[0];
  } else if (cleaned.includes('_DESC_')) {
    type = 'DESC';
    category = cleaned.split('_DESC_')[0];
  }

  return { type, category, index };
}

console.log('{{TRANSIT_HUB_IMAGE_1}}:', analyzePlaceholder('{{TRANSIT_HUB_IMAGE_1}}'));
console.log('{{TRANSITHUB_SITE_IMAGE_1}}:', analyzePlaceholder('{{TRANSITHUB_SITE_IMAGE_1}}'));
console.log('{{NATURAL_SITE_IMAGE_1}}:', analyzePlaceholder('{{NATURAL_SITE_IMAGE_1}}'));
console.log('{{EDU_SITE_IMAGE_1}}:', analyzePlaceholder('{{EDU_SITE_IMAGE_1}}'));
