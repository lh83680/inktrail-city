# -*- coding: utf-8 -*-
"""用 GitHub Git Data API 推送本地提交（git-over-HTTPS 写通道被重置时的替代路径）。
按提交顺序逐个建 blob/tree/commit，最后 fast-forward 更新 ref。
用法：GH_PAT=<token> python tools/github-api-push.py
注意：blob 用工作区文件内容，与 git 提交时的行尾归一化可能不同（见 README/git 行尾说明）。"""
import base64, json, os, subprocess, sys, time, urllib.request, urllib.error

REPO = 'lh83680/inktrail-city'
BRANCH = 'main'
API = f'https://api.github.com/repos/{REPO}'
TOKEN = os.environ['GH_PAT'].strip()

def git(*args):
    return subprocess.run(['git', *args], capture_output=True, check=True).stdout

def api(method, path, body=None, tries=5):
    data = json.dumps(body).encode() if body is not None else None
    last = None
    for i in range(tries):
        req = urllib.request.Request(f'{API}/{path}', data=data, method=method)
        req.add_header('Authorization', f'Bearer {TOKEN}')
        req.add_header('Accept', 'application/vnd.github+json')
        req.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:            # 网络瞬断/SSL EOF，退避重试
            last = e
            time.sleep(2 * (i + 1))
    raise last

def remote_ancestors(tip):
    """经 API 线性回溯远端分支历史，返回远端已知 commit sha 集合。"""
    shas = set()
    for page in range(1, 8):
        batch = api('GET', f'commits?sha={tip}&per_page=100&page={page}')
        if not batch or any(c['sha'] in shas for c in batch):
            break
        shas.update(c['sha'] for c in batch)
        if len(batch) < 100:
            break
    return shas


# 远端当前 main
ref = api('GET', 'git/ref/heads/' + BRANCH)
remote_sha = ref['object']['sha']
print('remote main  =', remote_sha[:8])

# 真实 base = 本地 HEAD 祖先中第一个远端已存在的提交。
# 不用 origin/main：fetch 被网络阻断时该引用会过期，按它 rev-list 会把已推过的提交再推一遍。
remote_set = remote_ancestors(remote_sha)
local_chain = subprocess.run(['git', 'rev-list', 'HEAD'], capture_output=True, check=True).stdout.decode().split()
base = next((s for s in local_chain if s in remote_set), None)
if base is None:
    sys.exit('本地 HEAD 与远端无共同祖先，拒绝盲推')
print('common base =', base[:8], f'| 待推 {len(local_chain) - local_chain.index(base) - 1} 个')

commits = git('rev-list', '--reverse', f'{base}..HEAD').decode().split()
print('to push     =', len(commits), [c[:8] for c in commits])
if not commits:
    print('nothing to push')
    sys.exit(0)

# 一律把提交挂到远端 tip 之下（等价 git push 的 fast-forward），永不产生分叉。


def meta(sha):
    out = git('show', '-s', '--format=%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%B', sha).decode('utf-8')
    an, ae, ad, cn, ce, cd, msg = out.split('\x00')
    return dict(an=an, ae=ae, ad=ad, cn=cn, ce=ce, cd=cd, msg=msg.strip())

def changes(sha):
    # 首个提交相对 base 算差异；base 与远端 tip 之间已由远端 tree 覆盖
    out = git('diff', '--name-status', f'{sha}^', sha).decode('utf-8')
    for line in out.splitlines():
        st, path = line.split('\t', 1)
        yield st, path

parent_tree = api('GET', f'git/commits/{remote_sha}')['tree']['sha']
parent_commit = remote_sha

for sha in commits:
    m = meta(sha)
    entries = []
    for st, path in changes(sha):
        if st == 'D':
            entries.append(dict(path=path, mode='100644', type='blob', sha=None))
            continue
        if st in ('R', 'C'):
            src, dst = path.split('\t')
            entries.append(dict(path=src, mode='100644', type='blob', sha=None))
            path = dst
        # 必须用提交内的规范字节（git cat-file blob），不能读工作区文件：
        # core.autocrlf=true 时工作区是 CRLF、提交存 LF，读工作区会把行尾推歪。
        raw = git('cat-file', 'blob', f'{sha}:{path}')
        blob = api('POST', 'git/blobs', dict(content=base64.b64encode(raw).decode(), encoding='base64'))
        entries.append(dict(path=path, mode='100644', type='blob', sha=blob['sha']))
    tree = api('POST', 'git/trees', dict(base_tree=parent_tree, tree=entries))
    commit = api('POST', 'git/commits', dict(
        message=m['msg'], tree=tree['sha'], parents=[parent_commit],
        author=dict(name=m['an'], email=m['ae'], date=m['ad']),
        committer=dict(name=m['cn'], email=m['ce'], date=m['cd'])))
    print(f"pushed {sha[:8]} -> {commit['sha'][:8]}  {m['msg'].splitlines()[0][:52]}")
    parent_tree = tree['sha']
    parent_commit = commit['sha']

new = api('PATCH', f'git/refs/heads/{BRANCH}', dict(sha=parent_commit, force=False))
print('ref updated ->', new['object']['sha'][:8], '| branch:', BRANCH)
