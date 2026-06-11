"use client";

import { addProjectComment } from "@/actions/projects";
import { CommentForm } from "./comment-form";

type Props = {
  projectId: string;
};

export function ProjectCommentForm({ projectId }: Props) {
  return (
    <CommentForm
      title="Коментар"
      onSubmit={(body) => addProjectComment(projectId, body)}
    />
  );
}
