export const PROJECT_VISIBILITIES = ['PRIVATE', 'SHARED'] as const;
export type ProjectVisibilityValue = (typeof PROJECT_VISIBILITIES)[number];
