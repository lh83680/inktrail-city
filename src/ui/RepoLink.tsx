const REPO = 'https://github.com/lh83680/inktrail-city'

/** 源码入口：报名表的 GitHub 仓库（选填）无法回填已通过作品，故在演示站内给出直达链接。 */
export function RepoLink() {
  return (
    <section className="panel">
      <h2 className="panel-title">源码与实现</h2>
      <p className="hint">
        字形锚点化、贴路吸附、分段算路与保真度内核全部开源；预编译快照兜底，弱网也能演示。
      </p>
      <div className="btn-row">
        <a className="btn" href={REPO} target="_blank" rel="noreferrer">
          GitHub 仓库
        </a>
      </div>
      <p className="vote-url">{REPO}</p>
    </section>
  )
}
