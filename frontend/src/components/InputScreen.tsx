import { useState } from 'react'
import { usePipelineStore } from '../store/pipeline.store'
import { transcriptMock } from '../data/transcript-mock'
import { confluenceMock } from '../data/confluence-mock'

export function InputScreen() {
  const [transcriptText, setTranscriptText] = useState('')
  const startRun = usePipelineStore((s) => s.startRun)

  function runTranscript() {
    const content = transcriptText.trim() || transcriptMock
    startRun({ inputType: 'transcript', inputLabel: 'meeting-transcript.txt', content })
  }

  function runConfluence() {
    startRun({
      inputType: 'confluence',
      inputLabel: confluenceMock.title,
      content: confluenceMock.content,
    })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-8"
      style={{ background: 'var(--color-canvas)' }}>
      {/* Header */}
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
          Knowledge Ledger
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
          Watch how the system processes a decision — step by step.
        </p>
      </div>

      {/* Input cards */}
      <div className="flex gap-6 w-full max-w-3xl">
        {/* Transcript card */}
        <div className="flex-1 flex flex-col gap-3 rounded-xl p-5"
          style={{ background: 'var(--color-node-bg)', border: '1px solid var(--color-node-border)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Meeting Transcript</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            Paste a transcript or leave blank to use the sample (Postgres vs DynamoDB decision).
          </p>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Paste transcript here, or leave blank for sample…"
            rows={7}
            style={{
              background: '#0f1117',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#e2e8f0',
              fontFamily: "'JetBrains Mono', monospace",
              resize: 'vertical',
              outline: 'none',
              width: '100%',
            }}
          />
          <button
            onClick={runTranscript}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}>
            Run →
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center">
          <span style={{ fontSize: 12, color: '#374151' }}>or</span>
        </div>

        {/* Confluence ADR card */}
        <div className="flex-1 flex flex-col gap-3 rounded-xl p-5"
          style={{ background: 'var(--color-node-bg)', border: '1px solid var(--color-node-border)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Confluence ADR</span>
            <span className="font-mono" style={{
              fontSize: 10, fontWeight: 700,
              background: '#f59e0b', color: '#1c1917',
              padding: '2px 6px', borderRadius: 4,
            }}>MOCKUP</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            Simulates ingesting a Confluence Architecture Decision Record.
          </p>
          <div style={{
            background: '#0f1117',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#94a3b8',
            flex: 1,
          }}>
            <div style={{ color: '#60a5fa', marginBottom: 4 }}>{confluenceMock.title}</div>
            <div>{confluenceMock.space}</div>
            <div style={{ marginTop: 4 }}>Author: {confluenceMock.author}</div>
            <div style={{ marginTop: 2 }}>
              Status:{' '}
              <span style={{ color: '#22c55e' }}>{confluenceMock.status}</span>
            </div>
          </div>
          <button
            onClick={runConfluence}
            style={{
              background: '#1e293b',
              color: '#f59e0b',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}>
            Run →
          </button>
        </div>
      </div>
    </div>
  )
}
