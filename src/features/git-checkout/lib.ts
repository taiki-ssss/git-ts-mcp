import { Result, ok, err } from 'neverthrow';
import { simpleGit, StatusResult } from 'simple-git';
import { existsSync } from 'fs';
import { GitCheckoutInput, GitCheckoutResult } from './types.js';
import createDebug from 'debug';

const debug = createDebug('mcp:git-checkout');

export async function gitCheckout(input: GitCheckoutInput): Promise<Result<GitCheckoutResult, Error>> {
  debug('gitCheckout called with:', input);

  const { repoPath, target, force = false, files } = input;

  if (!repoPath || !repoPath.trim()) {
    debug('Empty repository path provided');
    return err(new Error('Repository path cannot be empty'));
  }

  if (!target || !target.trim()) {
    debug('Empty target provided');
    return err(new Error('Target cannot be empty'));
  }

  if (!existsSync(repoPath)) {
    debug('Repository path does not exist:', repoPath);
    return err(new Error('Repository path does not exist'));
  }

  const git = simpleGit(repoPath);

  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      debug('Path is not a git repository:', repoPath);
      return err(new Error('The specified path is not a git repository'));
    }

    // 現在のブランチを取得
    const previousBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    debug('Current branch:', previousBranch);

    // ファイル指定のチェックアウトの場合
    if (files && files.length > 0) {
      debug('Checking out specific files:', files);
      
      try {
        // git checkout <target> -- <files>
        await git.checkout([target, '--', ...files]);
        
        return ok({
          success: true,
          previousBranch,
          currentBranch: previousBranch, // ファイルチェックアウトではブランチは変わらない
          message: `Updated ${files.length} path${files.length > 1 ? 's' : ''} from ${target}`,
          modifiedFiles: files
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        debug('File checkout failed:', message);
        return err(new Error(`Checkout failed: ${message}`));
      }
    }

    // ブランチ/コミットへのチェックアウトの場合
    
    // 未コミットの変更をチェック（forceがfalseの場合）
    if (!force) {
      const status = await git.status();
      if (hasUncommittedChanges(status)) {
        debug('Uncommitted changes detected');
        return err(new Error('Cannot checkout: You have uncommitted changes. Use force option to override.'));
      }
    }

    // 現在のブランチと同じ場合
    if (previousBranch === target) {
      return ok({
        success: true,
        previousBranch,
        currentBranch: target,
        message: `Already on '${target}'`
      });
    }

    // チェックアウト実行
    try {
      if (force) {
        await git.checkout(['--force', target]);
      } else {
        await git.checkout(target);
      }

      // チェックアウト後のブランチを取得
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      
      // デタッチドHEAD状態の場合
      if (currentBranch === 'HEAD') {
        const shortHash = await git.revparse(['--short', 'HEAD']);
        return ok({
          success: true,
          previousBranch,
          currentBranch: 'HEAD',
          message: `HEAD is now at ${shortHash}`
        });
      }

      return ok({
        success: true,
        previousBranch,
        currentBranch,
        message: `Switched to branch '${currentBranch}'`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      debug('Checkout failed:', message);
      return err(new Error(`Checkout failed: ${message}`));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    debug('Git checkout operation failed:', message);
    return err(new Error(`Git checkout failed: ${message}`));
  }
}

function hasUncommittedChanges(status: StatusResult): boolean {
  return (
    status.modified.length > 0 ||
    status.staged.length > 0 ||
    status.not_added.length > 0 ||
    status.deleted.length > 0 ||
    status.renamed.length > 0 ||
    status.conflicted.length > 0
  );
}