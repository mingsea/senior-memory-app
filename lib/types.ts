export type Role = "SENIOR" | "CAREGIVER";
export type Mood = "HAPPY" | "OK" | "SAD";
export type MediaType = "PHOTO" | "VIDEO";

export type ExerciseType =
  | "IDENTIFY_PEOPLE"
  | "REMEMBER_WORDS"
  | "DATE_ORIENTATION"
  | "COUNTING"
  | "COLOR_CATEGORY"
  | "NAME_ITEMS"
  | "DESCRIBE_PICTURE"
  | "MIRROR_ACTIONS"
  | "SIMPLE_SENTENCES"
  | "LONG_TERM_RECALL";

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
  displayName: string;
  seniorId?: string | null;
}
