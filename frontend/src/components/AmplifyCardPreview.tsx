import React from "react";

interface AmplifyCardPreviewProps {
  cards: any[];
  onApproveCard: (cardId: string) => void;
}

export const AmplifyCardPreview: React.FC<AmplifyCardPreviewProps> = ({ cards, onApproveCard }) => {
  const getBorderColor = (type: string) => {
    switch (type) {
      case "NEED": return "var(--signal-cyan)";
      case "RUMOUR": return "var(--dispute-amber)";
      case "WARNING": return "var(--critical-ember)";
      default: return "var(--grid-line)";
    }
  };

  return (
    <div style={{ padding: "24px", color: "var(--ink)", height: "100%", overflowY: "auto" }}>
      <h2 className="mono" style={{ color: "var(--signal-cyan)", marginBottom: "24px" }}>AMPLIFY CARD PREVIEWS</h2>
      
      {cards.length === 0 ? (
        <div style={{ color: "var(--ink-dim)" }}>No amplify cards generated yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
          {cards.map(card => {
            const isApproved = card.status === "APPROVED";
            
            return (
              <div key={card.card_id} style={{ 
                backgroundColor: "var(--panel-elevated)", 
                border: `2px solid ${getBorderColor(card.type)}`,
                padding: "16px",
                position: "relative"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <strong className="mono" style={{ color: getBorderColor(card.type) }}>{card.type} CARD</strong>
                  <span className="mono" style={{ 
                    padding: "2px 6px",
                    backgroundColor: isApproved ? "var(--signal-cyan)" : "var(--dispute-amber)",
                    color: "var(--void)",
                    fontWeight: "bold",
                    fontSize: "10px"
                  }}>
                    {card.status}
                  </span>
                </div>
                
                <div style={{ marginBottom: "16px", fontFamily: "var(--font-sans)" }}>
                  {card.type === "NEED" && (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Verified Need in {card.location_general}</div>
                      <div style={{ marginBottom: "8px" }}><strong>Items:</strong> {card.needed_items?.join(", ")}</div>
                      <div style={{ color: "var(--dispute-amber)", fontSize: "12px", borderLeft: "2px solid var(--dispute-amber)", paddingLeft: "8px" }}>
                        {card.instructions}
                      </div>
                    </>
                  )}
                  {card.type === "RUMOUR" && (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Rumour Check: {card.fact_status}</div>
                      <div style={{ marginBottom: "8px", fontStyle: "italic" }}>"{card.claim_text}"</div>
                      <div style={{ color: "var(--signal-cyan)", fontSize: "12px", borderLeft: "2px solid var(--signal-cyan)", paddingLeft: "8px" }}>
                        {card.instruction}
                      </div>
                    </>
                  )}
                  {card.type === "WARNING" && (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "var(--critical-ember)" }}>⚠️ Safety Warning: {card.area}</div>
                      <div style={{ marginBottom: "8px" }}>{card.instruction}</div>
                      <div style={{ color: "var(--critical-ember)", fontSize: "12px", borderLeft: "2px solid var(--critical-ember)", paddingLeft: "8px" }}>
                        {card.anti_panic_note}
                      </div>
                    </>
                  )}
                </div>

                {!isApproved && (
                  <button 
                    className="mono"
                    onClick={() => onApproveCard(card.card_id)}
                    style={{
                      width: "100%", padding: "8px", fontWeight: "bold",
                      backgroundColor: "transparent",
                      color: "var(--ink)",
                      border: "1px solid var(--ink-dim)",
                      cursor: "pointer"
                    }}
                  >
                    APPROVE FOR PUBLICATION
                  </button>
                )}
                {isApproved && (
                  <div className="mono" style={{ color: "var(--signal-cyan)", textAlign: "center", fontSize: "12px", padding: "8px" }}>
                    ✓ Approved by {card.approver_id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
