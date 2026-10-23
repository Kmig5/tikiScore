import { useState, type FormEvent } from "react";
import { FileText, Flag, LockKeyhole, MessageSquarePlus, Pin, Send } from "lucide-react";
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
  const { error, success } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const canParticipate = hasPermission(permissions, "forum:participate");
  const discussions = data.discussions.filter((discussion) => !discussion.hidden).sort((first, second) => Number(second.pinned) - Number(first.pinned));

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await tikiScoreService.createDiscussion(newMessage.trim());
      setNewMessage("");
      success("Conversation créée.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Impossible de créer la conversation.");
    }
  }

  if (!data.forumPublic && !canParticipate) return <div className={styles.page}><PageHeader eyebrow="Communauté" title="Le forum du championnat" /><EmptyState title="Forum réservé aux membres" body="L’organisation a désactivé l’accès public en lecture seule." action={<Link to="/communiques"><Button variant="secondary"><FileText size={15} aria-hidden="true" />Voir les communiqués</Button></Link>} /></div>;

  return <div className={styles.page}>
    <PageHeader eyebrow="Communauté" title="Le forum du championnat" description="Choisissez une conversation pour lire les messages et discuter. Les communiqués officiels restent dans leur espace dédié." action={<Link to="/communiques"><Button variant="secondary"><FileText size={15} aria-hidden="true" />Communiqués officiels</Button></Link>} />
    {canParticipate && <form className={`${styles.panel} ${styles.chatComposer}`} onSubmit={startConversation}><label className={styles.fieldLabel} htmlFor="new-conversation">Démarrer une conversation</label><div className={styles.chatComposeRow}><textarea id="new-conversation" className={`${styles.formInput} ${styles.chatInput}`} value={newMessage} onChange={(event) => setNewMessage(event.target.value)} maxLength={3000} placeholder="Écrire le premier message…" required /><Button aria-label="Créer une conversation" disabled={!newMessage.trim()}><MessageSquarePlus size={17} aria-hidden="true" /></Button></div></form>}
    {discussions.length ? <div className={styles.list}>{discussions.map((discussion) => <article className={styles.discussion} key={discussion.id}>
      <div className={styles.discussionMeta}>{discussion.pinned && <Badge variant="warning" size="small"><Pin size={11} aria-hidden="true" />Épinglé</Badge>}<Badge variant="neutral" size="small">{discussion.category}</Badge>{discussion.closed && <Badge variant="neutral" size="small"><LockKeyhole size={11} aria-hidden="true" />Fermée</Badge>}</div>
      <h3><Link to={`/communaute/${discussion.id}`}>{discussion.title}</Link></h3>
      <p>{discussion.body}</p>
      <span className={styles.discussionMeta}>{discussion.authorName} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(discussion.createdAt))} · {discussion.replies.length} message{discussion.replies.length === 1 ? "" : "s"}</span>
    </article>)}</div> : <EmptyState title="Aucune conversation" body="Les conversations du championnat apparaîtront ici." />}
  </div>;
}

export function DiscussionPage() {
  const { discussionId = "" } = useParams();
  const data = useTikiScoreData();
  const { permissions } = useDemoAccess();
  const { success, error } = useToast();
  const [message, setMessage] = useState("");
  const discussion = data.discussions.find((entry) => entry.id === discussionId);
  if (!discussion || discussion.hidden) return <div className={styles.page}><PageHeader title="Conversation indisponible" /><EmptyState title="Cette conversation n’est pas disponible" body="Elle a été retirée ou n’existe pas." action={<Link to="/communaute"><Button variant="secondary">Retour à la communauté</Button></Link>} /></div>;
  const canReply = hasPermission(permissions, "forum:participate") && !discussion.closed;

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discussion || !message.trim()) return;
    void tikiScoreService.addReply(discussion.id, message.trim()).then(() => success("Message envoyé.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "L’envoi du message a échoué."));
    setMessage("");
    success("Message ajouté à cette démonstration.");
  }

  return <div className={styles.page}>
    <Link className={styles.textLink} to="/communaute">← Retour au forum</Link>
    <article className={styles.discussion}>
      <div className={styles.discussionMeta}><Badge variant="neutral">{discussion.category}</Badge>{discussion.pinned && <Badge variant="warning"><Pin size={12} aria-hidden="true" />Épinglée</Badge>}{discussion.closed && <Badge variant="neutral">Conversation fermée</Badge>}</div>
      <PageHeader title={discussion.title} description="Conversation du championnat" />
      <div className={styles.chatMessages} aria-label="Messages de la conversation">
        <article className={styles.chatMessage}><div className={styles.chatMessageMeta}><strong>{discussion.authorName}</strong><time dateTime={discussion.createdAt}>{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(discussion.createdAt))}</time></div><p>{discussion.body}</p></article>
        {discussion.replies.filter((item) => !item.hidden).map((item) => <article className={styles.chatMessage} key={item.id}><div className={styles.chatMessageMeta}><strong>{item.authorName}</strong><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}</time></div><p>{item.body}</p></article>)}
      </div>
      <div className={styles.discussionActions}>{hasPermission(permissions, "forum:report") && <Button variant="ghost" size="small" onClick={() => { void tikiScoreService.addForumReport(discussion.id, "Contenu signalé par un membre.").then(() => success("Signalement envoyé aux modérateurs.")).catch((cause: unknown) => error(cause instanceof Error ? cause.message : "Le signalement n’a pas abouti.")); }}><Flag size={14} aria-hidden="true" />Signaler</Button>}</div>
    </article>
    {canReply ? <form className={`${styles.panel} ${styles.chatComposer}`} onSubmit={sendMessage}><label className={styles.fieldLabel} htmlFor="chat-message">Votre message</label><div className={styles.chatComposeRow}><textarea id="chat-message" className={`${styles.formInput} ${styles.chatInput}`} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder="Écrire un message…" required /><Button aria-label="Envoyer le message" disabled={!message.trim()}><Send size={17} aria-hidden="true" /></Button></div></form> : <div className={styles.warningBox}><LockKeyhole size={16} aria-hidden="true" />{discussion.closed ? "Cette conversation est fermée." : "Connectez-vous avec un compte membre pour envoyer des messages."}</div>}
  </div>;
}
