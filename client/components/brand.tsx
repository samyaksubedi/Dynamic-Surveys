import { Link } from 'react-router-dom';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link to={href} className="brand" aria-label="Dynamic Surveys home">
      <span className="brand-mark">D</span>
      <span>Dynamic</span>
    </Link>
  );
}
