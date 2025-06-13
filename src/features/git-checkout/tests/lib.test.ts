import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { simpleGit } from 'simple-git';
import { gitCheckout } from '../lib.js';

describe('gitCheckout', () => {
  const testRepoPath = join(__dirname, 'test-repo');
  let git: any;

  beforeEach(async () => {
    await mkdir(testRepoPath, { recursive: true });
    git = simpleGit(testRepoPath);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');
  });

  afterEach(async () => {
    await rm(testRepoPath, { recursive: true, force: true });
  });

  describe('正常系', () => {
    it('ブランチを切り替えできる', async () => {
      // mainブランチでコミット作成
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      // featureブランチを作成して切り替え
      await git.checkoutBranch('feature', 'main');
      await writeFile(join(testRepoPath, 'file2.txt'), 'content2');
      await git.add('file2.txt');
      await git.commit('Feature commit');

      // mainブランチに戻る
      await git.checkout('main');

      // git_checkoutでfeatureブランチに切り替え
      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'feature'
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.previousBranch).toBe('main');
        expect(result.value.currentBranch).toBe('feature');
        expect(result.value.message).toContain('Switched to branch');
      }

      // 実際に切り替わっているか確認
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      expect(currentBranch).toBe('feature');
    });

    it('コミットハッシュにチェックアウトできる', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('First commit');

      await writeFile(join(testRepoPath, 'file2.txt'), 'content2');
      await git.add('file2.txt');
      await git.commit('Second commit');

      const log = await git.log();
      const firstCommitHash = log.all[1].hash;

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: firstCommitHash
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.message).toContain('HEAD is now at');
      }
    });

    it('特定のファイルのみチェックアウトできる', async () => {
      // mainブランチでファイル作成
      await writeFile(join(testRepoPath, 'file1.txt'), 'main content 1');
      await writeFile(join(testRepoPath, 'file2.txt'), 'main content 2');
      await git.add('.');
      await git.commit('Initial commit');

      // featureブランチで変更
      await git.checkoutBranch('feature', 'main');
      await writeFile(join(testRepoPath, 'file1.txt'), 'feature content 1');
      await writeFile(join(testRepoPath, 'file2.txt'), 'feature content 2');
      await git.add('.');
      await git.commit('Feature changes');

      // mainブランチに戻る
      await git.checkout('main');

      // file1.txtのみfeatureブランチからチェックアウト
      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'feature',
        files: ['file1.txt']
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.modifiedFiles).toEqual(['file1.txt']);
        expect(result.value.message).toContain('Updated 1 path');
      }

      // file1.txtは変更され、file2.txtは変更されていないことを確認
      const file1Content = await git.show(['HEAD:file1.txt']);
      const file2Content = await git.show(['HEAD:file2.txt']);
      expect(file1Content).toBe('main content 1'); // HEADはまだmainのまま
      expect(file2Content).toBe('main content 2');
    });

    it('強制チェックアウトができる', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      await git.checkoutBranch('feature', 'main');
      await writeFile(join(testRepoPath, 'file1.txt'), 'feature content');
      await git.add('file1.txt');
      await git.commit('Feature commit');

      await git.checkout('main');

      // 未コミットの変更を作成
      await writeFile(join(testRepoPath, 'file1.txt'), 'uncommitted changes');

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'feature',
        force: true
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.currentBranch).toBe('feature');
      }
    });

    it('現在のブランチと同じブランチを指定した場合', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'main'
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.currentBranch).toBe('main');
        expect(result.value.message).toContain('Already on');
      }
    });
  });

  describe('異常系', () => {
    it('存在しないブランチの場合はエラーを返す', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'non-existent-branch'
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('did not match any');
      }
    });

    it('未コミットの変更がある場合はエラーを返す（forceがfalse）', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      await git.checkoutBranch('feature', 'main');
      await git.checkout('main');

      // 未コミットの変更を作成
      await writeFile(join(testRepoPath, 'file1.txt'), 'uncommitted changes');

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'feature'
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('uncommitted changes');
      }
    });

    it('無効なリポジトリパスの場合はエラーを返す', async () => {
      const result = await gitCheckout({
        repoPath: '/invalid/path',
        target: 'main'
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Repository path does not exist');
      }
    });

    it('空文字列のリポジトリパスの場合はエラーを返す', async () => {
      const result = await gitCheckout({
        repoPath: '',
        target: 'main'
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Repository path cannot be empty');
      }
    });

    it('空文字列のターゲットの場合はエラーを返す', async () => {
      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: ''
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Target cannot be empty');
      }
    });

    it('存在しないファイルを指定した場合はエラーを返す', async () => {
      await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
      await git.add('file1.txt');
      await git.commit('Initial commit');

      await git.checkoutBranch('feature', 'main');

      const result = await gitCheckout({
        repoPath: testRepoPath,
        target: 'main',
        files: ['non-existent.txt']
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('error: pathspec');
      }
    });

  });
});