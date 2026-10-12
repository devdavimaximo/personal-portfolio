import { useRef } from 'react';
import { manifesto, works } from '../content';
import { useReveal } from '../lib/reveal';

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  const [first, second, ...rest] = manifesto.split(/(?<=\.)\s/);
  const systems = works.filter((w) => w.stack.some((s) => s.includes('.NET') || s.includes('ASP.NET'))).length;

  return (
    <section className="manifesto" id="sobre" ref={root}>
      <header className="sec-head">
        <p className="label">
          <span className="label__idx">(01)</span> <span data-scramble>/sobre</span>
        </p>
        <p className="label label--right">quem responde do outro lado</p>
      </header>

      <p className="manifesto__text" data-words>
        <em>{first}</em> <em>{second}</em> {rest.join(' ')}
      </p>

      <dl className="manifesto__facts">
        <div data-rise="0">
          <dt>Linguagem principal</dt>
          <dd>C#</dd>
        </div>
        <div data-rise="0.08">
          <dt>Sistemas .NET no portfólio</dt>
          <dd>{String(systems).padStart(2, '0')}</dd>
        </div>
        <div data-rise="0.16">
          <dt>Casos no total</dt>
          <dd>{String(works.length).padStart(2, '0')}</dd>
        </div>
        <div data-rise="0.24">
          <dt>Arquitetura de base</dt>
          <dd>Clean</dd>
        </div>
      </dl>
    </section>
  );
}
