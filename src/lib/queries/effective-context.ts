import { cache } from "react";
import { isSuperAdminRole } from "@/lib/auth";
import type { SessionContext } from "@/lib/auth";
import { getViewAsModeForUser, type ViewAsMode } from "@/lib/view-as";
import type { UserRole } from "@/lib/types/database";
import {
  resolveUserOfficeContext,
  type UserOfficeContext,
} from "@/lib/queries/user-offices";

export type EffectiveContext = {
  viewAs: ViewAsMode | null;
  isRealSuperAdmin: boolean;
  effectiveRole: UserRole;
  isAdminView: boolean;
  showAdminNav: boolean;
  forcedOfficeId?: string;
  forcedOfficeCode?: string;
  officeCtx: UserOfficeContext;
};

export const resolveEffectiveContext = cache(
  async (ctx: SessionContext): Promise<EffectiveContext> => {
    const baseOfficeCtx = await resolveUserOfficeContext(ctx);
    const isRealSuperAdmin = isSuperAdminRole(ctx.profile.role);
    const viewAs = await getViewAsModeForUser(ctx);

    if (!isRealSuperAdmin || !viewAs || viewAs === "super_admin") {
      return {
        viewAs: isRealSuperAdmin ? "super_admin" : null,
        isRealSuperAdmin,
        effectiveRole: ctx.profile.role,
        isAdminView: ctx.profile.role !== "office_member",
        showAdminNav: isRealSuperAdmin,
        officeCtx: baseOfficeCtx,
      };
    }

    const office = baseOfficeCtx.offices.find((o) => o.code === viewAs);
    const singleOffice = office ? [office] : [];

    return {
      viewAs,
      isRealSuperAdmin: true,
      effectiveRole: "office_member",
      isAdminView: false,
      showAdminNav: false,
      forcedOfficeId: office?.id,
      forcedOfficeCode: viewAs,
      officeCtx: {
        ...baseOfficeCtx,
        isSuperAdmin: false,
        canFilter: false,
        userOffices: singleOffice,
        filterOffices: singleOffice,
        canUseOfficeFilter: false,
      },
    };
  }
);
