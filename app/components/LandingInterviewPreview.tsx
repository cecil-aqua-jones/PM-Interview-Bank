"use client";

export default function LandingInterviewPreview() {
  return (
    <div className="landing-interview-preview">
      {/* Question Header */}
      <div className="landing-interview-header">
        <span className="landing-interview-difficulty">Medium</span>
        <h4 className="landing-interview-title">Two Sum</h4>
      </div>

      {/* Mini Code Editor */}
      <div className="landing-interview-editor">
        <div className="landing-interview-editor-header">
          <span className="landing-interview-lang">Python</span>
        </div>
        <pre className="landing-interview-code">
{`def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`}
        </pre>
      </div>

      {/* AI Follow-up */}
      <div className="landing-interview-ai">
        <div className="landing-interview-ai-avatar">AI</div>
        <div className="landing-interview-ai-bubble">
          <p>"What's the time complexity of your solution? How would it handle duplicate values?"</p>
        </div>
      </div>
    </div>
  );
}
