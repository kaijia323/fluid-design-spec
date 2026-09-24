#!/usr/bin/env node
/* ============================================================================
 * 流体设计规范 · 安装收尾脚本                scripts/install.mjs   v1.1
 *
 * 用法（在项目根目录执行，规范目录就在旁边）：
 *   git clone --depth 1 https://github.com/kaijia323/fluid-design-spec.git fluid-design-spec
 *   node fluid-design-spec/scripts/install.mjs
 *
 * 做两件事：
 *   1. 把「写界面前先读规范」的约束块写进 AGENTS.md（没有就新建；没有 AGENTS.md
 *      但有 CLAUDE.md 就写进 CLAUDE.md）。块首尾有标记，重复跑不会写两遍。
 *   2. 删掉 <规范目录>/.git —— 不删的话项目 git 只会把整个规范目录记成一个子模块
 *      指针（mode 160000），规范文件本身进不了你自己的仓库；删掉后它就是普通
 *      文件夹，git add 会把每个文件收进去。
 * 做完打印读取组合与下一步命令。
 *
 * 安全边界（v1.1 起）：
 *   · 只写两个位置：项目根下的 AGENTS.md / CLAUDE.md、删 <规范目录>/.git；
 *     不碰项目里任何其它文件。
 *   · agent 文件按字节读、按字节追加，非 UTF-8（如 GBK）的旧文件不会被写坏（会提示）。
 *   · agent 文件是符号链接、或 --agents-md 指到项目根外面时拒绝写入。
 *   · 判断不出项目根目录时拒绝执行（可用 --root 明确指定）。
 *   · 索引里已经记成 160000 子模块指针时，打印出恢复命令。
 *
 * 选项：
 *   --root <dir>     指定项目根目录（默认：规范目录的上一级；它不像项目根时退回当前目录）
 *   --agents-md <f>  指定约束块写进哪个文件，相对项目根目录（默认 AGENTS.md / CLAUDE.md）
 *   --no-agents      只删 .git，不碰 AGENTS.md / CLAUDE.md
 *   --keep-git       只写约束块，保留 .git（只是想看规范、不打算提交进项目时用）
 *   --dry-run        只打印将要做的事，不落盘
 *   -h, --help       看这段说明
 *
 * 退出码：0 成功；1 失败（判断不出项目根 / 路径越界 / 删或写失败）
 * 零依赖：只用 node 内置模块，Node >= 18
 * ==========================================================================*/

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MARK_BEGIN = '<!-- fluid-design-spec:begin -->';
const MARK_END   = '<!-- fluid-design-spec:end -->';
const CLONE_URL  = 'https://github.com/kaijia323/fluid-design-spec.git';

const USAGE = `流体设计规范 · 安装收尾脚本  scripts/install.mjs

用法（在项目根目录执行，规范目录就在旁边）：
  git clone --depth 1 ${CLONE_URL} fluid-design-spec
  node fluid-design-spec/scripts/install.mjs [选项]

做两件事：
  1. 把「写界面前先读规范」的约束块写进 AGENTS.md（没有就新建；没有 AGENTS.md 但
     有 CLAUDE.md 就写进 CLAUDE.md；带标记，重复跑不会写两遍）；
  2. 删掉 <规范目录>/.git —— 不删的话项目 git 只会把规范目录记成一个子模块指针
     （mode 160000），规范文件进不了你自己的仓库。
做完打印读取组合与下一步命令。

选项：
  --root <dir>     指定项目根目录（默认：规范目录的上一级；它不像项目根时退回当前目录）
  --agents-md <f>  指定约束块写进哪个文件，相对项目根目录（默认 AGENTS.md / CLAUDE.md）
  --no-agents      只删 .git，不碰 AGENTS.md / CLAUDE.md
  --keep-git       只写约束块，保留 .git（只是想看规范、不打算提交进项目时用）
  --dry-run        只打印将要做的事，不落盘
  -h, --help       看这段说明

退出码：0 成功；1 失败（判断不出项目根 / 路径越界 / 删或写失败）
零依赖：只用 node 内置模块，Node >= 18`;

/* ============================== 参数解析 ============================== */

function parseArgs(argv) {
  const opts = { root: '', agentsMd: '', noAgents: false, keepGit: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq === -1 ? a : a.slice(0, eq);
    const inlineVal = eq === -1 ? null : a.slice(eq + 1);
    const takeVal = () => {
      if (inlineVal !== null) {
        if (inlineVal === '') throw new Error(key + ' 需要一个值');
        return inlineVal;
      }
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(key + ' 需要一个值');
      return v;
    };
    if (key === '--root') opts.root = takeVal();
    else if (key === '--agents-md') opts.agentsMd = takeVal();
    else if (key === '--no-agents') opts.noAgents = true;
    else if (key === '--keep-git') opts.keepGit = true;
    else if (key === '--dry-run') opts.dryRun = true;
    else throw new Error('不认识的参数：' + a);
  }
  return opts;
}

/* ============================== 小工具 ============================== */

function toPosix(p) { return p.split(path.sep).join('/'); }

function statOrNull(p) { try { return fs.lstatSync(p); } catch { return null; } }

function isFile(p) { const s = statOrNull(p); return !!s && s.isFile(); }

function isDir(p) { const s = statOrNull(p); return !!s && s.isDirectory(); }

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    n += entry.isDirectory() ? countFiles(path.join(dir, entry.name)) : 1;
  }
  return n;
}

// 是否在 root 里面（含等于）
function isInside(root, p) {
  const rel = path.relative(root, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// exit 0 = 被忽略；1 = 没被忽略；其他（没装 git / 不是 git 仓库）= 不当作忽略
function ignoredByGit(projectRoot, name) {
  try {
    execFileSync('git', ['-C', projectRoot, 'check-ignore', '-q', '--', name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 索引里这个路径的模式（'160000' = 子模块指针、'100644' = 普通文件、null = 没被跟踪 / 不是 git 仓库）
function gitIndexModes(projectRoot, specRef) {
  try {
    const out = execFileSync('git', ['-C', projectRoot, 'ls-files', '-s', '--', specRef], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').filter(Boolean).map((l) => l.split(/\s+/)[0]).filter(Boolean);
  } catch {
    return null;
  }
}

/* ============================== 项目根判定 ============================== */

// 「像不像项目根」：有 .git、或已经有 AGENTS.md / CLAUDE.md
function looksLikeProjectRoot(dir) {
  return isDir(path.join(dir, '.git')) || isFile(path.join(dir, '.git'))
    || isFile(path.join(dir, 'AGENTS.md')) || isFile(path.join(dir, 'CLAUDE.md'));
}

function resolveProjectRoot(opts, specDir) {
  const cwd = process.cwd();
  if (opts.root) {
    return { root: path.resolve(cwd, opts.root), source: '--root' };
  }
  const parent = path.dirname(specDir);
  if (looksLikeProjectRoot(parent)) {
    return { root: parent, source: '规范目录的上一级（clone 的位置）' };
  }
  if (cwd !== specDir && isInside(cwd, specDir)) {
    return { root: cwd, source: '当前目录' };
  }
  return { root: null, source: '', parent };
}

/* ============================== 约束块 ============================== */

function buildBlock(specRef) {
  return [
    MARK_BEGIN,
    '## 流体设计规范（ColorOS 17 衍生；本地副本：' + specRef + '/）',
    '',
    '写界面（HTML / CSS / 组件）之前先读规范，生成后按各文件末尾的自查清单验收。',
    '',
    '- 读取组合：移动端 = `' + specRef + '/Design.md` + `' + specRef + '/fluid-design.skill.md` + `' + specRef + '/DESIGN.mobile.md`；' +
      'Web / B 端 = `' + specRef + '/Design.md` + `' + specRef + '/fluid-design.skill.md` + `' + specRef + '/DESIGN.web.md`',
    '- 生成前先声明：「我将遵循 ' + specRef + '/Design.md 的规范生成代码。」',
    '- 颜色 / 圆角 / 间距 / 动效一律走 `' + specRef + '/tokens/tokens.css` 的 CSS 变量，禁止硬编码；主色块上的文字用 `--color-on-accent`，不要写 `#fff`。',
    '- 品牌色只改 `' + specRef + '/tokens/brand.css` 的两个输入值；派生值跑 `node ' + specRef + '/scripts/brand.mjs derive \'#色值\'` 生成，不要手写。',
    '- 生成后跑一次体检：`node ' + specRef + '/scripts/brand.mjs check`（默认配置应当 9 pass / 0 fail / 3 warn）。',
    MARK_END,
  ].join('\n');
}

/* ============================== 主流程 ============================== */

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('-h') || argv.includes('--help')) { console.log(USAGE); return 0; }

  let opts;
  try { opts = parseArgs(argv); }
  catch (e) { console.error('参数错误：' + e.message + '\n\n' + USAGE); return 1; }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const specDir   = path.resolve(scriptDir, '..');
  const specName  = path.basename(specDir);

  console.log('流体设计规范 · 安装收尾' + (opts.dryRun ? '（--dry-run，不落盘）' : ''));
  console.log('  规范目录  ' + specDir);

  // —— 前置检查：这确实是规范目录吗 ——
  const mustHave = ['Design.md', 'fluid-design.skill.md', 'DESIGN.mobile.md', 'DESIGN.web.md', 'tokens/tokens.css', 'tokens/brand.css', 'scripts/brand.mjs'];
  const missing = mustHave.filter((f) => !fs.existsSync(path.join(specDir, f)));
  if (missing.length) {
    console.error('\n✗ 这里不像流体设计规范目录，缺少：' + missing.join('、'));
    console.error('  先装规范再跑本脚本（在项目根目录执行）：');
    console.error('    git clone --depth 1 ' + CLONE_URL + ' ' + specName);
    return 1;
  }

  // —— 项目根目录：判断不出来就拒绝，别往错的地方写 ——
  const picked = resolveProjectRoot(opts, specDir);
  if (!picked.root) {
    console.error('\n✗ 判断不出你的项目根目录。');
    console.error('  规范目录的上一级是 ' + picked.parent + '，但它既不是 git 仓库、也没有 AGENTS.md / CLAUDE.md，');
    console.error('  当前目录（' + process.cwd() + '）也不在规范目录之上，所以不敢替你决定把约束块写到哪。');
    console.error('  请二选一：');
    console.error('    1) 在项目根目录执行：cd <你的项目根> && node ' + toPosix(path.relative(process.cwd(), path.join(scriptDir, 'install.mjs'))));
    console.error('    2) 明确指定：node scripts/install.mjs --root <你的项目根>');
    console.error('  只想删 .git、不写 agent 文件的话，加 --no-agents 即可跳过这一步。');
    return 1;
  }
  const projectRoot = picked.root;
  if (projectRoot === path.parse(projectRoot).root) {
    console.error('\n✗ 项目根目录解析成了文件系统根目录，请用 --root <你的项目目录> 指定。');
    return 1;
  }
  if (!isInside(projectRoot, specDir)) {
    console.error('\n✗ 规范目录 ' + specDir + ' 不在项目根 ' + projectRoot + ' 里面，请用 --root 指定正确的项目根。');
    return 1;
  }

  const specRef = toPosix(path.relative(projectRoot, specDir)) || '.';
  const gitDir  = path.join(specDir, '.git');
  const hasGit  = fs.existsSync(gitDir);
  const gitIsFile = isFile(gitDir);
  const projectHasGit = fs.existsSync(path.join(projectRoot, '.git'));

  console.log('  项目根    ' + projectRoot + '（来源：' + picked.source + '）');
  console.log('  引入路径  ' + specRef + '/');
  console.log('  规范文件  ' + countFiles(specDir) + ' 个');
  console.log('');

  /* ---- 1. 写约束块（先做不破坏性的一步；删 .git 放后面） ---- */
  const agentsPath = opts.agentsMd ? path.resolve(projectRoot, opts.agentsMd) : path.join(projectRoot, 'AGENTS.md');
  const claudePath = path.join(projectRoot, 'CLAUDE.md');
  let agentsTarget = null;

  if (opts.noAgents) {
    console.log('· --no-agents：只删 .git，不碰 AGENTS.md / CLAUDE.md');
  } else if (opts.agentsMd && !isInside(projectRoot, agentsPath)) {
    console.error('\n✗ --agents-md 指到了项目根外面：' + agentsPath);
    console.error('  只允许写项目根目录里面的文件。');
    return 1;
  } else {
    // 只读前 4KB 做标记判断，再决定候选文件
    const hasBlock = (p) => isFile(p) && fs.readFileSync(p).includes(Buffer.from(MARK_BEGIN, 'utf8'));
    const alreadyIn = [agentsPath, claudePath].filter(hasBlock);

    if (alreadyIn.length) {
      console.log('· ' + toPosix(path.relative(projectRoot, alreadyIn[0])) + ' 里已有规范约束块，跳过（要重写就先删掉 ' + MARK_BEGIN + ' 到 ' + MARK_END + ' 那段）');
    } else {
      agentsTarget = opts.agentsMd
        ? agentsPath
        : (isFile(agentsPath) ? agentsPath : (isFile(claudePath) ? claudePath : agentsPath));
      const rel = toPosix(path.relative(projectRoot, agentsTarget));
      const st = statOrNull(agentsTarget);

      if (st && st.isSymbolicLink()) {
        console.log('· ✗ ' + rel + ' 是符号链接，为避免写到项目外面，已跳过（要写就换真实文件：--agents-md <路径>；或加 --no-agents）');
        agentsTarget = null;
      } else if (st && st.isDirectory()) {
        console.log('· ✗ ' + rel + ' 是个目录，没法写，已跳过（改名或加 --no-agents）');
        agentsTarget = null;
      } else if (opts.dryRun) {
        console.log('· [dry-run] 将把规范约束块写进 ' + rel + (st ? '（追加）' : '（新建）'));
      } else {
        try {
          fs.mkdirSync(path.dirname(agentsTarget), { recursive: true });   // --agents-md 指到还没建的子目录时补上
          const block = Buffer.from(buildBlock(specRef) + '\n', 'utf8');
          if (st) {
            const old = fs.readFileSync(agentsTarget);                       // 按字节读，绝不重新编码旧内容
            const sep = old.length && old[old.length - 1] !== 0x0a ? '\n\n' : '\n';
            fs.writeFileSync(agentsTarget, Buffer.concat([old, Buffer.from(sep, 'utf8'), block]));
            const roundTrip = Buffer.compare(old, Buffer.from(old.toString('utf8'), 'utf8')) === 0;
            console.log('· 已把规范约束块追加到 ' + rel + '（原有 ' + old.length + ' 字节原样保留）');
            if (!roundTrip) {
              console.log('  ⚠ ' + rel + ' 不是 UTF-8（可能是 GBK 等）：你原有的字节一个没动，追加的这段是 UTF-8；');
              console.log('    如果你的编辑器不是 UTF-8，可能看到新增段落乱码，建议把该文件另存为 UTF-8。');
            }
          } else {
            fs.writeFileSync(agentsTarget, block);
            console.log('· 已新建 ' + rel + '，写入规范约束块');
          }
        } catch (e) {
          console.error('\n✗ 写 ' + rel + ' 失败：' + e.message);
          console.error('  可以加 --no-agents 只删 .git，把约束块自己记进去。');
          return 1;
        }
      }
    }
  }

  /* ---- 2. 删 .git ---- */
  if (opts.keepGit) {
    console.log('· --keep-git：保留 ' + specRef + '/.git');
    console.log('  ⚠ 项目 git 会把 ' + specRef + '/ 记成一个子模块指针（mode 160000），规范文件本身不会进你的仓库。');
  } else if (!hasGit) {
    console.log('· ' + specRef + '/.git 已不存在，跳过');
  } else if (opts.dryRun) {
    console.log('· [dry-run] 将删除 ' + specRef + '/.git' + (gitIsFile ? '（注意：它是个文件，像是 submodule / worktree 形式）' : ''));
  } else {
    if (gitIsFile) {
      console.log('· ' + specRef + '/.git 是个文件（submodule / worktree 形式），删除它不会动到项目索引里的子模块登记。');
    }
    try {
      fs.rmSync(gitDir, { recursive: true, force: true, maxRetries: 3 });
    } catch (e) {
      console.error('\n✗ 删除 ' + specRef + '/.git 失败：' + e.message);
      console.error('  手动删掉它再重跑：rm -rf ' + specRef + '/.git');
      return 1;
    }
    if (fs.existsSync(gitDir)) {
      console.error('\n✗ 删除 ' + specRef + '/.git 后它还在，请手动删掉：rm -rf ' + specRef + '/.git');
      return 1;
    }
    console.log('· 已删除 ' + specRef + '/.git（现在它是普通文件夹，git add 会把文件逐个收进你的仓库）');
  }

  /* ---- 3. 提醒与核对 ---- */
  if (!projectHasGit) {
    console.log('  ⚠ ' + projectRoot + ' 里没有 .git，这不是 git 仓库；规范文件照常用，但不会被版本管理。');
  } else if (ignoredByGit(projectRoot, specName)) {
    console.log('  ⚠ 你的 .gitignore 忽略了 ' + specName + '/，git add 收不到规范文件；要提交就先在 .gitignore 里放行。');
  }

  // 索引里已经是子模块指针吗？（先 add/commit 过、或本来就是 submodule）
  const modes = projectHasGit ? gitIndexModes(projectRoot, specRef) : null;
  if (modes && modes.includes('160000')) {
    console.log('  ⚠ 你的 git 索引里 ' + specRef + '/ 还是子模块指针（mode 160000），只删 .git 不会自动变回普通文件。');
    console.log('    执行下面两行把它换成普通文件（-f 不能省，否则 git 会以「staged content different」拒绝）：');
    console.log('      git rm -r -f --cached ' + specRef);
    console.log('      git add ' + specRef);
    if (isFile(path.join(projectRoot, '.gitmodules'))) {
      console.log('    项目里还有 .gitmodules 登记着它，再补一步（不影响文件进仓库，只是清掉登记）：');
      console.log('      git config -f .gitmodules --remove-section submodule.' + specRef + ' && git add -A');
    }
  }

  /* ---- 4. 下一步 ---- */
  const addTargets = [specRef];
  if (agentsTarget && !opts.dryRun) addTargets.push(toPosix(path.relative(projectRoot, agentsTarget)));

  console.log('');
  console.log('下一步：');
  console.log('  1. git add ' + addTargets.join(' ') + ' && git commit -m "chore: 引入流体设计规范"');
  console.log('  2. 换品牌色：改 ' + specRef + '/tokens/brand.css，再跑 node ' + specRef + '/scripts/brand.mjs derive \'#你的色值\'');
  console.log('  3. 体检：node ' + specRef + '/scripts/brand.mjs check');
  console.log('');
  console.log('读取组合（路径都在 ' + specRef + '/ 下）：');
  console.log('  移动端       Design.md + fluid-design.skill.md + DESIGN.mobile.md');
  console.log('  Web / B 端   Design.md + fluid-design.skill.md + DESIGN.web.md');
  return 0;
}

process.exit(main());
