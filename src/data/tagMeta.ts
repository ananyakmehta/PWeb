// DD_initial_build.md §5.2 — each pill needs a 1-2 sentence description, filler text
// this pass. Order here also sets the pill display order in the filter bar.

export interface TagMeta {
  key: string;
  label: string;
  description: string;
}

export const typeTagMeta: TagMeta[] = [
  { key: 'research', label: 'Research', description: '[Placeholder] Structured investigative work, usually with a lab or PI.' },
  { key: 'project', label: 'Project', description: '[Placeholder] Self-directed or team build, outside a formal research setting.' },
  { key: 'publication', label: 'Publication', description: '[Placeholder] Work that resulted in a published paper or article.' },
  { key: 'internship', label: 'Internship', description: '[Placeholder] Time-boxed work at an external organization.' },
  { key: 'experience', label: 'Experience', description: "[Placeholder] Broader activities that don't fit the other categories neatly." },
];

export const topicTagMeta: TagMeta[] = [
  { key: 'ml', label: 'ML', description: '[Placeholder] Machine learning models, training, or applied inference.' },
  { key: 'fluids-aero', label: 'Fluids/Aero', description: '[Placeholder] Fluid dynamics and aerodynamics-focused work.' },
  { key: 'biomechanics', label: 'Biomechanics', description: '[Placeholder] Work touching human or biological movement and systems.' },
  { key: 'mechanical-design', label: 'Mechanical Design', description: '[Placeholder] CAD, physical prototyping, and mechanical systems.' },
  { key: 'signal-processing', label: 'Signal Processing', description: '[Placeholder] Signal analysis, filtering, or related DSP work.' },
];
