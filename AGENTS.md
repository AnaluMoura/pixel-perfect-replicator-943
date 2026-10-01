<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data access goes through the browser database client with TanStack Query hooks in src/lib/data.ts; aggregations (averages, ranking) are computed client-side from the full bid list because the dataset is small.
- Deságio is computed by a database trigger on licitacoes, never sent from the client, so the formula has a single source of truth.
