import { SQLiteDatabase } from "react-native-sqlite-storage";

export type User = {
  email: string;
  name: string;
}

export type UserFull = User & {
  id: number;
}

export type CommentBase = {
  parent_id: number;
  user_id: number;
  content: string;
}

export type Comment = CommentBase & {
  id: number;
  created_at: string;
  sub_comments?: Comment[];
}

export type RootStackParamList = {
  Home: { db: SQLiteDatabase; user: UserFull; }
  Auth: { db: SQLiteDatabase; }
};