import { jsonFileReviewCaseRepositoryAdapter } from "./json-file-review-case-adapter";
import { postgresReviewCaseRepositoryAdapter } from "../repositories/review-case-repository";
import type { ReviewCaseRepositoryAdapter, ReviewCaseRepositoryAdapterId } from "./repository-types";

const adapters: Record<ReviewCaseRepositoryAdapterId, ReviewCaseRepositoryAdapter> = {
  json_file_repository: jsonFileReviewCaseRepositoryAdapter,
  postgres_repository: postgresReviewCaseRepositoryAdapter,
  planned_database_repository: {
    id: "planned_database_repository",
    readReviewCases: notImplemented("readReviewCases"),
    readReviewCaseById: notImplemented("readReviewCaseById"),
    writeReviewCases: notImplemented("writeReviewCases"),
    updateReviewCase: notImplemented("updateReviewCase"),
    createReviewCase: notImplemented("createReviewCase"),
    resetReviewCases: notImplemented("resetReviewCases")
  }
};

function notImplemented(operation: string) {
  return async () => {
    throw new Error(
      `Storage adapter planned_database_repository is not configured. ${operation} must pass repository parity tests before activation.`
    );
  };
}

function resolveAdapterId(): ReviewCaseRepositoryAdapterId {
  if (process.env.USE_POSTGRES === "true") {
    return "postgres_repository";
  }

  const configured = process.env.AKSH_STORAGE_ADAPTER ?? "json_file_repository";
  if (
    configured === "json_file_repository" ||
    configured === "postgres_repository" ||
    configured === "planned_database_repository"
  ) {
    return configured;
  }

  throw new Error(
    `Unknown storage adapter "${configured}". Supported values: json_file_repository, postgres_repository, planned_database_repository.`
  );
}

export function getConfiguredReviewCaseRepositoryAdapterId(): ReviewCaseRepositoryAdapterId {
  return resolveAdapterId();
}

export function getReviewCaseRepositoryAdapter(): ReviewCaseRepositoryAdapter {
  const adapterId = resolveAdapterId();
  const adapter = adapters[adapterId];

  if (adapterId === "planned_database_repository" && process.env.AKSH_ALLOW_PLANNED_STORAGE_ADAPTER !== "true") {
    throw new Error(
      `Storage adapter ${adapterId} is contract-defined only. Set AKSH_ALLOW_PLANNED_STORAGE_ADAPTER=true after parity tests pass.`
    );
  }

  return adapter;
}
