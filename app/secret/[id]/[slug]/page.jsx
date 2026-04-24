'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import SecretCard, { ReportButton } from '@/components/SecretCard';

export default function SecretPage({ params }) {
  const routeParams = use(params);
  const [secret, setSecret] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSecret() {
      try {
        const data = await api(`/api/secrets/${routeParams.id}/${routeParams.slug || ''}`);
        setSecret(data.secret);
        setComments(data.comments);
      } catch (err) {
        setError(err.message);
      }
    }

    loadSecret();
  }, [routeParams.id, routeParams.slug]);

  async function load() {
    try {
      const data = await api(`/api/secrets/${routeParams.id}/${routeParams.slug || ''}`);
      setSecret(data.secret);
      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    try {
      await api(`/api/comments/secret/${routeParams.id}`, { method: 'POST', body: JSON.stringify({ content, parentId: replyTo }) });
      setContent('');
      setReplyTo(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !secret) return <main className="main"><div className="notice error">{error}</div></main>;
  if (!secret) return <main className="main"><div className="notice">טוען...</div></main>;

  const roots = comments.filter((comment) => !comment.parent_id);

  return (
    <main className="main">
      <SecretCard secret={secret} onChanged={load} />
      <section className="grid" style={{ marginTop: '1rem' }}>
        <form className="form auth-panel" onSubmit={submit}>
          <textarea className="textarea" placeholder={replyTo ? 'תגובה לתגובה' : 'תגובה לסוד'} required value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="actions">
            <button className="btn primary">שליחת תגובה</button>
            {replyTo && <button className="btn" type="button" onClick={() => setReplyTo(null)}>ביטול תגובה</button>}
          </div>
        </form>
        <div className="grid">
          {roots.map((comment) => (
            <Comment key={comment.id} comment={comment} replies={comments.filter((reply) => reply.parent_id === comment.id)} onReply={setReplyTo} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Comment({ comment, replies, onReply }) {
  return (
    <article className="comment">
      <strong>{comment.nickname}</strong>
      <p>{comment.content}</p>
      <div className="toolbar muted">
        <button className="chip" onClick={() => onReply(comment.id)}>תגובה</button>
        <ReportButton targetType="comment" targetId={comment.id} />
      </div>
      {replies.map((reply) => (
        <div className="comment reply" key={reply.id}>
          <strong>{reply.nickname}</strong>
          <p>{reply.content}</p>
          <ReportButton targetType="comment" targetId={reply.id} />
        </div>
      ))}
    </article>
  );
}
