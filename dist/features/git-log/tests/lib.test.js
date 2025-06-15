import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { simpleGit } from 'simple-git';
import { gitLog } from '../lib.js';
describe('gitLog', () => {
    const testRepoPath = join(__dirname, 'test-repo');
    let git;
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
        it('コミット履歴を取得できる', async () => {
            await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('First commit');
            await writeFile(join(testRepoPath, 'file2.txt'), 'content2');
            await git.add('file2.txt');
            await git.commit('Second commit');
            const result = await gitLog({ repoPath: testRepoPath });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.logs).toHaveLength(2);
                expect(result.value.logs[0].message).toBe('Second commit');
                expect(result.value.logs[1].message).toBe('First commit');
                expect(result.value.logs[0].author).toBe('Test User');
                expect(result.value.logs[0].email).toBe('test@example.com');
            }
        });
        it('件数を指定してコミット履歴を取得できる', async () => {
            for (let i = 1; i <= 5; i++) {
                await writeFile(join(testRepoPath, `file${i}.txt`), `content${i}`);
                await git.add('.');
                await git.commit(`Commit ${i}`);
            }
            const result = await gitLog({ repoPath: testRepoPath, maxCount: 3 });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.logs).toHaveLength(3);
                expect(result.value.logs[0].message).toBe('Commit 5');
                expect(result.value.logs[2].message).toBe('Commit 3');
            }
        });
        it('ブランチを指定してコミット履歴を取得できる', async () => {
            await writeFile(join(testRepoPath, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Main branch commit');
            await git.checkoutBranch('feature', 'HEAD');
            await writeFile(join(testRepoPath, 'file2.txt'), 'content2');
            await git.add('file2.txt');
            await git.commit('Feature branch commit');
            await git.checkout('main');
            const mainResult = await gitLog({ repoPath: testRepoPath, branch: 'main' });
            const featureResult = await gitLog({ repoPath: testRepoPath, branch: 'feature' });
            expect(mainResult.isOk()).toBe(true);
            expect(featureResult.isOk()).toBe(true);
            if (mainResult.isOk() && featureResult.isOk()) {
                expect(mainResult.value.logs).toHaveLength(1);
                expect(mainResult.value.logs[0].message).toBe('Main branch commit');
                expect(featureResult.value.logs).toHaveLength(2);
                expect(featureResult.value.logs[0].message).toBe('Feature branch commit');
            }
        });
        it('空のリポジトリの場合は空の配列を返す', async () => {
            const result = await gitLog({ repoPath: testRepoPath });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.logs).toEqual([]);
            }
        });
        it('コミットハッシュが含まれる', async () => {
            await writeFile(join(testRepoPath, 'file.txt'), 'content');
            await git.add('file.txt');
            await git.commit('Test commit');
            const result = await gitLog({ repoPath: testRepoPath });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.logs[0].hash).toMatch(/^[a-f0-9]{40}$/);
            }
        });
        it('日時が正しい形式で含まれる', async () => {
            await writeFile(join(testRepoPath, 'file.txt'), 'content');
            await git.add('file.txt');
            await git.commit('Test commit');
            const result = await gitLog({ repoPath: testRepoPath });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const date = new Date(result.value.logs[0].date);
                expect(date.toString()).not.toBe('Invalid Date');
            }
        });
    });
    describe('異常系', () => {
        it('無効なリポジトリパスの場合はエラーを返す', async () => {
            const result = await gitLog({ repoPath: '/invalid/path' });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Repository path does not exist');
            }
        });
        it('存在しないブランチを指定した場合はエラーを返す', async () => {
            await writeFile(join(testRepoPath, 'file.txt'), 'content');
            await git.add('file.txt');
            await git.commit('Initial commit');
            const result = await gitLog({ repoPath: testRepoPath, branch: 'non-existent' });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('branch not found');
            }
        });
        it('空文字列のリポジトリパスの場合はエラーを返す', async () => {
            const result = await gitLog({ repoPath: '' });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Repository path cannot be empty');
            }
        });
        it('空白のみのリポジトリパスの場合はエラーを返す', async () => {
            const result = await gitLog({ repoPath: '   ' });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Repository path cannot be empty');
            }
        });
        it('負のmaxCountを指定した場合はエラーを返す', async () => {
            const result = await gitLog({ repoPath: testRepoPath, maxCount: -1 });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('maxCount must be a positive number');
            }
        });
        it('0のmaxCountを指定した場合はエラーを返す', async () => {
            const result = await gitLog({ repoPath: testRepoPath, maxCount: 0 });
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('maxCount must be a positive number');
            }
        });
        it('Git操作でエラーが発生した場合はエラーメッセージを返す', async () => {
            await writeFile(join(testRepoPath, 'file.txt'), 'content');
            await git.add('file.txt');
            await git.commit('Initial commit');
            // .gitディレクトリを一時的に破損させる
            const gitConfigPath = join(testRepoPath, '.git', 'config');
            const originalConfig = await readFile(gitConfigPath, 'utf-8');
            await writeFile(gitConfigPath, 'invalid content');
            try {
                const result = await gitLog({ repoPath: testRepoPath });
                expect(result.isErr()).toBe(true);
                if (result.isErr()) {
                    expect(result.error.message).toContain('Git log failed:');
                }
            }
            finally {
                // 元の設定を復元
                await writeFile(gitConfigPath, originalConfig);
            }
        });
    });
});
