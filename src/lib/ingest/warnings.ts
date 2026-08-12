import type { CanhBao } from "../parser";

export type ContractWarningCode =
  | "DIEU_NHAY_COC"
  | "THIEU_SO_HIEU"
  | "KHONG_XAC_DINH_LOAI"
  | "KHOAN_KHONG_TRONG_DIEU"
  | "PHU_LUC_KHONG_PARSE";

export interface ContractWarning {
  code: ContractWarningCode;
  message: string;
  line?: number;
}

/**
 * Contract hien chi co ma cho hai canh bao metadata ma parser co the tao chinh xac.
 * Cac chan doan noi bo khac van duoc luu day du o documents.loi_chi_tiet.
 */
export function toContractWarnings(warnings: CanhBao[]): ContractWarning[] {
  return warnings.flatMap((warning): ContractWarning[] => {
    let code: ContractWarningCode | null = null;
    if (warning.loai === "thieu_metadata" && warning.thong_diep.includes('"so_hieu"')) {
      code = "THIEU_SO_HIEU";
    } else if (
      warning.loai === "thieu_metadata" &&
      warning.thong_diep.includes('"loai_van_ban"')
    ) {
      code = "KHONG_XAC_DINH_LOAI";
    }

    return code
      ? [
          {
            code,
            message: warning.thong_diep,
            ...(warning.dong === undefined ? {} : { line: warning.dong }),
          },
        ]
      : [];
  });
}
