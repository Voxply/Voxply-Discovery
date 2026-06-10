"use client";
import React, { useState, useEffect, useRef } from "react";

type Step = 1 | 2 | 3 | 4;

interface Template {
  template_id: string;
  name: string;
  description: string;
  tags: string;
}

interface Farm {
  farm_pubkey: string;
  name: string;
  description: string;
  pricing_tiers: string;
  farm_url: string;
}

function readQueryParams(): { templateId: string | null; deployPath: "farm" | "docker" | "binary" } {
  if (typeof window === "undefined") return { templateId: null, deployPath: "docker" };
  const params = new URLSearchParams(window.location.search);
  return {
    templateId: params.get("template_id"),
    deployPath: params.get("farm") ? "farm" : "docker",
  };
}

export default function NewHubPage() {
  const initRef = useRef(false);
  const [step, setStep] = useState<Step>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(() => readQueryParams().templateId);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [hubName, setHubName] = useState("");
  const [hubDesc, setHubDesc] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState<string | null>(null);
  const [deployPath, setDeployPath] = useState<"farm" | "docker" | "binary">(() => readQueryParams().deployPath);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d: { templates?: Template[] }) => setTemplates(d.templates ?? []));
    fetch("/api/farms")
      .then((r) => r.json())
      .then((d: { farms?: Farm[] }) => setFarms(d.farms ?? []));
  }, []);

  async function generateToken() {
    const res = await fetch("/api/wizard/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: hubName,
        description: hubDesc,
        template_id: selectedTemplate,
      }),
    });
    const d = (await res.json()) as { token?: string };
    if (d.token) setBootstrapToken(d.token);
  }

  const hubNameEncoded = encodeURIComponent(hubName || "My Hub");
  const discoveryUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://discovery.voxply.app";

  const dockerCommand = bootstrapToken
    ? `docker run -d --name voxply-hub \\
  -p 3000:3000 -p 3001:3001/udp \\
  -v $(pwd)/hub-data:/data \\
  -e DATABASE_URL=sqlite:///data/hub.db \\
  -e VOXPLY_BOOTSTRAP_TOKEN=${bootstrapToken} \\
  -e VOXPLY_DISCOVERY_URL=${discoveryUrl} \\
  ghcr.io/voxply/hub:latest`
    : "Generating…";

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Create a new hub</h1>
      <p style={{ color: "#96989d", marginBottom: 24 }}>Step {step} of 4</p>
      <div
        style={{
          background: "#2b2d31",
          borderRadius: 8,
          padding: 24,
          border: "1px solid #3a3d44",
        }}
      >
        {step === 1 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Pick a template</h2>
            <p style={{ color: "#96989d", fontSize: 14 }}>
              Choose a starting point for your hub&apos;s channels and roles.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  border: `2px solid ${selectedTemplate === null ? "#5865f2" : "#3a3d44"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                onClick={() => setSelectedTemplate(null)}
              >
                <input
                  type="radio"
                  checked={selectedTemplate === null}
                  onChange={() => setSelectedTemplate(null)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Blank</div>
                  <div style={{ fontSize: 12, color: "#96989d" }}>
                    Start from scratch
                  </div>
                </div>
              </label>
              {templates.map((t) => (
                <label
                  key={t.template_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    border: `2px solid ${selectedTemplate === t.template_id ? "#5865f2" : "#3a3d44"}`,
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedTemplate(t.template_id)}
                >
                  <input
                    type="radio"
                    checked={selectedTemplate === t.template_id}
                    onChange={() => setSelectedTemplate(t.template_id)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#96989d" }}>
                      {t.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: "10px 24px",
                background: "#5865f2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Customise your hub</h2>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Hub name
            </label>
            <input
              value={hubName}
              onChange={(e) => setHubName(e.target.value)}
              placeholder="My Awesome Hub"
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #3a3d44",
                background: "#1e1f22",
                color: "#dbdee1",
                borderRadius: 4,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Description
            </label>
            <textarea
              value={hubDesc}
              onChange={(e) => setHubDesc(e.target.value)}
              placeholder="What's your hub about?"
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #3a3d44",
                background: "#1e1f22",
                color: "#dbdee1",
                borderRadius: 4,
                height: 80,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: "10px 24px",
                  background: "#3a3d44",
                  color: "#dbdee1",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!hubName.trim()}
                style={{
                  padding: "10px 24px",
                  background: "#5865f2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  opacity: hubName.trim() ? 1 : 0.5,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Choose deployment</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["docker", "binary", "farm"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setDeployPath(p)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: `2px solid ${deployPath === p ? "#5865f2" : "#3a3d44"}`,
                    background: deployPath === p ? "#5865f24d" : "#1e1f22",
                    color: "#dbdee1",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {p === "farm" ? "Managed Farm" : p}
                </button>
              ))}
            </div>
            {deployPath === "farm" && (
              <div>
                {farms.length === 0 ? (
                  <p style={{ color: "#96989d" }}>
                    No farms available. Try Docker or Binary.
                  </p>
                ) : (
                  farms.map((f) => (
                    <label
                      key={f.farm_pubkey}
                      style={{
                        display: "block",
                        padding: 12,
                        border: `2px solid ${selectedFarm?.farm_pubkey === f.farm_pubkey ? "#5865f2" : "#3a3d44"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                      onClick={() => setSelectedFarm(f)}
                    >
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: "#96989d" }}>
                        {f.description}
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: "10px 24px",
                  background: "#3a3d44",
                  color: "#dbdee1",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={async () => {
                  await generateToken();
                  setStep(4);
                }}
                style={{
                  padding: "10px 24px",
                  background: "#5865f2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Deploy →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Your hub is ready!</h2>
            {deployPath === "docker" && bootstrapToken && (
              <div>
                <p style={{ color: "#96989d", fontSize: 14 }}>
                  Run this command on your server. The token expires in 24
                  hours.
                </p>
                <pre
                  style={{
                    background: "#1e1f22",
                    padding: 12,
                    borderRadius: 4,
                    fontSize: 12,
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {dockerCommand}
                </pre>
                <button
                  onClick={() => navigator.clipboard?.writeText(dockerCommand)}
                  style={{
                    padding: "6px 14px",
                    background: "#3a3d44",
                    color: "#dbdee1",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                >
                  Copy
                </button>
              </div>
            )}
            {deployPath === "binary" && bootstrapToken && (
              <div>
                <p style={{ color: "#96989d", fontSize: 14 }}>
                  Download the binary and run:
                </p>
                <pre
                  style={{
                    background: "#1e1f22",
                    padding: 12,
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >{`VOXPLY_BOOTSTRAP_TOKEN=${bootstrapToken} VOXPLY_DISCOVERY_URL=${discoveryUrl} ./voxply-hub`}</pre>
              </div>
            )}
            {deployPath === "farm" && selectedFarm && (
              <div>
                <p style={{ color: "#96989d", fontSize: 14 }}>
                  Join {selectedFarm.name} to host your hub:
                </p>
                <a
                  href={`${selectedFarm.farm_url}?hub_name=${hubNameEncoded}&token=${bootstrapToken ?? ""}`}
                  style={{
                    display: "inline-block",
                    padding: "10px 24px",
                    background: "#5865f2",
                    color: "#fff",
                    borderRadius: 4,
                    textDecoration: "none",
                  }}
                >
                  Join {selectedFarm.name} →
                </a>
              </div>
            )}
            <p
              style={{ color: "#96989d", fontSize: 12, marginTop: 16 }}
            >
              Once running, your hub will auto-register with this discovery
              service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
