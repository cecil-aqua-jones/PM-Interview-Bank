export type Company = {
  id: string;
  name: string;
  slug: string;
  questionCount?: number;
};

export type Question = {
  id: string;
  title: string;
  prompt: string;
  tags: string[];
  difficultyLabel?: string;
  difficultyScore?: number;
  companySlug?: string;
  requirements?: string[];
};
