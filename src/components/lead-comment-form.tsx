"use client";

import { addLeadComment } from "@/actions/leads";
import { CommentForm } from "./comment-form";

type Props = {
  leadId: string;
};

export function LeadCommentForm({ leadId }: Props) {
  return (
    <CommentForm
      title="Додати коментар"
      onSubmit={(body) => addLeadComment(leadId, body)}
    />
  );
}
