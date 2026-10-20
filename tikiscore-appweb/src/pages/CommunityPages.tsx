import { useState, type FormEvent } from "react";
import { FileText, Flag, LockKeyhole, Pin, Plus, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Badge from "../composants/ui/Badge";
import Button from "../composants/ui/Button";
import { useDemoAccess } from "../app/useDemoAccess";
import { useTikiScoreData } from "../app/hooks";
import { hasPermission } from "../domain/permissions";
import { tikiScoreService } from "../services/tikiScoreService";
import { useToast } from "../contexts/useToast";
import { EmptyState, PageHeader } from "./shared";
import styles from "./pages.module.css";

export function CommunityPage() {
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);
  const canParticipate = hasPermission(permissions, "forum:participate");
  const discussions = data.discussions.filter((discussion) => !discussion.hidden).sort((first, second) => Number(second.pinned) - Number(first.pinned));

  if (!data.forumPublic && !canParticipate) return <div className={styles.page}><PageHeader eyebrow="Communauté" title="Le forum du championnat" /><EmptyState title="Forum réservé aux membres" body="L’organisation a désactivé l’accès public en lecture seule." action={<Link to="/communiques"><Button variant="secondary"><FileText size={15} aria-hidden="true" />Voir les communiqués</Button></Link>} /></div>;

  function submitDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    tikiScoreService.addDiscussion(title.trim(), body.trim(), "Membre de démonstration");
    setTitle("");
    setBody("");
    setShowForm(false);
    success("Discussion ajoutée à cette démonstration.");
  }

  return <div className={styles.page}>
    <PageHeader eyebrow="Communauté" title="Le forum du championnat" description="Échanges entre supporters et équipes. Les communiqués officiels restent dans leur espace dédié." action={<div className={styles.discussionActions}><Link to="/communiques"><Button variant="secondary"><FileText size={15} aria-hidden="true" />Communiqués officiels</Button></Link>{canParticipate && <Button onClick={() => setShowForm((current) => !current)}><Plus size={16} aria-hidden="true" />Nouvelle discussion</Button>}</div>} />
    {showForm && <form className={`${styles.panel} ${styles.formStack}`} onSubmit={submitDiscussion}>
      <h2 className={styles.panelTitle}>Créer une discussion · aperçu local</h2>
      <label className={styles.fieldLabel}>Titre<input className={styles.formInput} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
      <label className={styles.fieldLabel}>Message<textarea className={`${styles.formInput} ${styles.formTextarea}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} required /></label>
      <div><Button type="submit" disabled={!title.trim() || !body.trim()}><Send size={15} aria-hidden="true" />Publier</Button></div>
    </form>}
    <div className={styles.warningBox}><Flag size={16} aria-hidden="true" /><span>Les messages créés ici ne sont pas transmis au serveur. N’ajoute aucune information personnelle.</span></div>
    {discussions.length ? <div className={styles.list}>{discussions.map((discussion) => <article className={styles.discussion} key={discussion.id}>
      <div className={styles.discussionMeta}>{discussion.pinned && <Badge variant="warning" size="small"><Pin size={11} aria-hidden="true" />Épinglé</Badge>}<Badge variant="neutral" size="small">{discussion.category}</Badge>{discussion.closed && <Badge variant="neutral" size="small"><LockKeyhole size={11} aria-hidden="true" />Fermée</Badge>}</div>
      <h3><Link to={`/communaute/${discussion.id}`}>{discussion.title}</Link></h3>
      <p>{discussion.body}</p>
      <span className={styles.discussionMeta}>{discussion.authorName} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(discussion.createdAt))} · {discussion.replies.length} réponse{discussion.replies.length === 1 ? "" : "s"}</span>
    </article>)}</div> : <EmptyState title="Aucune discussion" body="Les discussions du championnat apparaîtront ici." />}
  </div>;
}

export function DiscussionPage() {
  const { discussionId = "" } = useParams();
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success } = useToast();
  const [reply, setReply] = useState("");
  const discussion = data.discussions.find((entry) => entry.id === discussionId);
  if (!discussion || discussion.hidden) return <div className={styles.page}><PageHeader title="Discussion indisponible" /><EmptyState title="Cette discussion n’est pas disponible" body="Elle a été retirée ou n’existe pas." action={<Link to="/communaute"><Button variant="secondary">Retour à la communauté</Button></Link>} /></div>;
  const canReply = hasPermission(permissions, "forum:participate") && !discussion.closed;

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discussion || !reply.trim()) return;
    tikiScoreService.addReply(discussion.id, reply.trim(), "Membre de démonstration");
    setReply("");
    success("Réponse ajoutée à cette démonstration.");
  }

  return <div className={styles.page}>
    <Link className={styles.textLink} to="/communaute">← Retour au forum</Link>
    <article className={styles.discussion}>
      <div className={styles.discussionMeta}><Badge variant="neutral">{discussion.category}</Badge>{discussion.pinned && <Badge variant="warning"><Pin size={12} aria-hidden="true" />Épinglée</Badge>}{discussion.closed && <Badge variant="neutral">Discussion fermée</Badge>}</div>
      <PageHeader title={discussion.title} description={`${discussion.authorName} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(discussion.createdAt))}`} />
      <p className={styles.contentText}>{discussion.body}</p>
      <div className={styles.discussionActions}>{hasPermission(permissions, "forum:report") && <Button variant="ghost" size="small" onClick={() => { tikiScoreService.addForumReport(discussion.id, "Signalement envoyé depuis l’aperçu membre."); success("Signalement ajouté à la file de modération démo."); }}><Flag size={14} aria-hidden="true" />Signaler</Button>}</div>
    </article>
    <section className={styles.section}><h2 className={styles.panelTitle}>Réponses ({discussion.replies.filter((item) => !item.hidden).length})</h2>
      {discussion.replies.filter((item) => !item.hidden).length ? <div className={styles.list}>{discussion.replies.filter((item) => !item.hidden).map((item) => <article className={styles.panel} key={item.id}><p className={styles.contentText}>{item.body}</p><span className={styles.discussionMeta}>{item.authorName} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(item.createdAt))}</span></article>)}</div> : <EmptyState title="Pas encore de réponse" body="Soyez le premier à participer à la discussion." />}
    </section>
    {canReply ? <form className={`${styles.panel} ${styles.formStack}`} onSubmit={submitReply}><h2 className={styles.panelTitle}>Votre réponse · aperçu local</h2><label className={styles.fieldLabel}>Message<textarea className={`${styles.formInput} ${styles.formTextarea}`} value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1000} required /></label><div><Button type="submit" disabled={!reply.trim()}><Send size={15} aria-hidden="true" />Répondre</Button></div></form> : <div className={styles.warningBox}><LockKeyhole size={16} aria-hidden="true" />{discussion.closed ? "Cette discussion est fermée." : "Choisissez un profil membre dans l’aperçu pour répondre."}</div>}
  </div>;
}