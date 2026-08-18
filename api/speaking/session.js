import { requireSession } from "../../lib/server/session.js";

export default async function handler(req,res){
  const user=await requireSession(req,res); if(!user) return;
  if(req.method!=="POST") return res.status(405).json({message:"Method not allowed."});
  const key=process.env.XAI_API_KEY;
  if(!key) return res.status(500).json({message:"XAI_API_KEY is not configured."});
  try{
    const r=await fetch("https://api.x.ai/v1/realtime/client_secrets",{
      method:"POST",
      headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({expires_after:{seconds:300}})
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok) return res.status(r.status).json({message:d?.error?.message||"Unable to create a realtime voice session."});
    return res.status(200).json({token:d.value,expiresAt:d.expires_at,model:process.env.XAI_VOICE_MODEL||"grok-voice-latest"});
  }catch(error){console.error("xAI realtime session error",error);return res.status(500).json({message:"Unable to create a realtime voice session."});}
}
