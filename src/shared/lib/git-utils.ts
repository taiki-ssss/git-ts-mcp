import { Result, ok, err } from 'neverthrow';
import { simpleGit, SimpleGit } from 'simple-git';
import { existsSync } from 'fs';
import debugFactory from 'debug';

const debug = debugFactory('mcp:git-utils');

export interface GitInstance {
  git: SimpleGit;
  repoPath: string;
}

export interface GitValidationResult {
  isValid: boolean;
  git?: SimpleGit;
  error?: string;
}

const gitInstanceCache = new Map<string, SimpleGit>();

export async function validateAndInitializeGit(
  repoPath: string,
  useCache: boolean = false
): Promise<Result<GitInstance, Error>> {
  debug('Validating and initializing git instance', { repoPath, useCache });

  if (!repoPath || typeof repoPath !== 'string' || repoPath.trim().length === 0) {
    debug('Invalid repository path provided', { repoPath });
    return err(new Error('Repository path is required and must be a non-empty string'));
  }

  const normalizedPath = repoPath.trim();

  if (!existsSync(normalizedPath)) {
    debug('Repository path does not exist', { repoPath: normalizedPath });
    return err(new Error(`Repository path does not exist: ${normalizedPath}`));
  }

  try {
    let git: SimpleGit;

    if (useCache && gitInstanceCache.has(normalizedPath)) {
      debug('Using cached git instance', { repoPath: normalizedPath });
      git = gitInstanceCache.get(normalizedPath)!;
    } else {
      debug('Creating new git instance', { repoPath: normalizedPath });
      git = simpleGit(normalizedPath);
      
      if (useCache) {
        gitInstanceCache.set(normalizedPath, git);
      }
    }

    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      debug('Path is not a git repository', { repoPath: normalizedPath });
      return err(new Error(`The path '${normalizedPath}' is not a git repository`));
    }

    debug('Git instance validated and initialized successfully', { repoPath: normalizedPath });
    return ok({ git, repoPath: normalizedPath });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug('Failed to initialize git instance', { error: errorMessage, repoPath: normalizedPath });
    return err(new Error(`Failed to initialize git repository: ${errorMessage}`));
  }
}

export function validateRepositoryPath(repoPath: string): Result<string, Error> {
  if (!repoPath || typeof repoPath !== 'string') {
    return err(new Error('Repository path is required and must be a string'));
  }

  const trimmed = repoPath.trim();
  if (trimmed.length === 0) {
    return err(new Error('Repository path cannot be empty'));
  }

  return ok(trimmed);
}

export function validateNonEmptyString(value: string, fieldName: string): Result<string, Error> {
  if (!value || typeof value !== 'string') {
    return err(new Error(`${fieldName} is required and must be a string`));
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(new Error(`${fieldName} cannot be empty`));
  }

  return ok(trimmed);
}

export function clearGitCache(): void {
  debug('Clearing git instance cache');
  gitInstanceCache.clear();
}

export function getCacheSize(): number {
  return gitInstanceCache.size;
}
