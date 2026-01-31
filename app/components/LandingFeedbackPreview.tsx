"use client";

type DimensionScore = {
  name: string;
  score: number;
};

const mockDimensions: DimensionScore[] = [
  { name: "Correctness", score: 4.5 },
  { name: "Complexity", score: 4.0 },
  { name: "Code Quality", score: 4.2 },
  { name: "Communication", score: 4.3 },
  { name: "Problem Solving", score: 4.0 },
];

export default function LandingFeedbackPreview() {
  const overallScore = 4.2;
  const verdict = "Pass";

  return (
    <div className="landing-feedback-preview">
      {/* Type Label */}
      <div className="landing-feedback-type">Coding Interview</div>

      {/* Score Display */}
      <div className="landing-feedback-score">
        <span className="landing-feedback-score-value">
          {overallScore.toFixed(1)}
        </span>
        <span className="landing-feedback-score-max">/5</span>
      </div>

      {/* Verdict Badge */}
      <div className="landing-feedback-verdict">{verdict}</div>

      {/* Dimension Breakdown */}
      <div className="landing-feedback-breakdown">
        {mockDimensions.map((dim) => (
          <div key={dim.name} className="landing-feedback-dimension">
            <div className="landing-feedback-dim-header">
              <span className="landing-feedback-dim-name">{dim.name}</span>
              <span className="landing-feedback-dim-score">
                {dim.score.toFixed(1)}
              </span>
            </div>
            <div className="landing-feedback-dim-bar">
              <div
                className="landing-feedback-dim-bar-fill"
                style={{ width: `${(dim.score / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
