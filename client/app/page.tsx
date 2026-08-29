import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  GripVertical,
  Plus,
  Sparkles,
} from 'lucide-react';

const previewQuestions = [
  { label: 'How did you hear about us?', type: 'Single select' },
  { label: 'What should we improve next?', type: 'Long answer' },
  { label: 'How would you rate the experience?', type: 'Rating' },
];

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link to="/" className="brand" aria-label="Dynamic Surveys home">
          <span className="brand-mark">D</span>
          <span>Dynamic</span>
        </Link>
        <nav className="landing-links" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#principles">Principles</a>
        </nav>
        <div className="landing-actions">
          <Link to="/sign-in" className="button button-quiet">Sign in</Link>
          <Link to="/sign-up" className="button button-dark">Start building</Link>
        </div>
      </header>

      <section className="hero" id="product">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} strokeWidth={1.8} /> Thoughtful questions. Clearer decisions.</p>
          <h1>Surveys that feel considered.</h1>
          <p className="hero-description">Build adaptive surveys, collect responses without friction, and understand what people actually mean.</p>
          <div className="hero-actions">
            <Link to="/sign-up" className="button button-accent button-large">Create your first survey <ArrowRight size={17} /></Link>
            <a href="#principles" className="text-link">See how it works</a>
          </div>
          <div className="trust-row" aria-label="Product highlights">
            <span><Check size={15} /> Draft autosave</span>
            <span><Check size={15} /> Conditional paths</span>
            <span><Check size={15} /> Clear analytics</span>
          </div>
        </div>

        <div className="builder-preview" aria-label="Survey builder preview">
          <div className="preview-topbar">
            <div><span className="preview-kicker">Customer research</span><strong>Product feedback</strong></div>
            <button type="button" className="preview-status">Accepting responses <ChevronDown size={14} /></button>
          </div>
          <div className="preview-workspace">
            <aside className="preview-sidebar">
              <div className="preview-sidebar-title"><span>Questions</span><small>05</small></div>
              <button type="button" className="preview-add"><Plus size={15} /> Add question</button>
              <div className="preview-meta"><BarChart3 size={15} /> Analytics</div>
            </aside>
            <div className="preview-canvas">
              <div className="preview-heading"><span>Survey structure</span><small>Drag to reorder</small></div>
              <div className="preview-list">
                {previewQuestions.map((question, index) => (
                  <div className="preview-question" key={question.label}>
                    <GripVertical size={17} className="drag-icon" />
                    <span className="question-number">0{index + 1}</span>
                    <div><strong>{question.label}</strong><small>{question.type}</small></div>
                    {index === 0 && <span className="logic-badge">Logic</span>}
                  </div>
                ))}
              </div>
              <div className="preview-footer"><span>All changes saved</span><button type="button">Preview survey</button></div>
            </div>
          </div>
        </div>
      </section>

      <section className="principles" id="principles">
        <p>Built for the whole feedback loop</p>
        <div>
          <article><span>01</span><h2>Shape the right questions</h2><p>Four focused question types, stable options, and clear conditional paths.</p></article>
          <article><span>02</span><h2>Respect every respondent</h2><p>Anonymous drafts, quiet autosave, and forms that only ask what matters.</p></article>
          <article><span>03</span><h2>Read the signal</h2><p>Submitted-only counts, distributions, ratings, and thoughtful text responses.</p></article>
        </div>
      </section>
    </main>
  );
}
