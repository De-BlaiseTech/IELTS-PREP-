import asyncio,json,os,re,sys
from pathlib import Path
import edge_tts
try:
 import boto3
except ImportError: boto3=None
ROOT=Path(__file__).resolve().parents[1]
BANK=ROOT/"content/listening-audio-bank.json"
OUT=ROOT/"generated-listening-audio"
VOICE=os.getenv("EDGE_TTS_VOICE","en-GB-SoniaNeural")
RATE=os.getenv("EDGE_TTS_RATE","-5%")
B2_BUCKET=os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT=os.getenv("B2_S3_ENDPOINT","https://s3.eu-central-003.backblazeb2.com")
B2_REGION=os.getenv("B2_REGION","eu-central-003")
B2_KEY_ID=os.getenv("B2_KEY_ID")
B2_APPLICATION_KEY=os.getenv("B2_APPLICATION_KEY")
UPLOAD=os.getenv("UPLOAD_TO_B2","true").lower()=="true"
def slug(v): return re.sub(r"[^a-zA-Z0-9_-]+","-",str(v)).strip("-").lower() or "test"
def items(data):
 if isinstance(data,list): return data
 if isinstance(data,dict):
  for k in ("tests","listeningTests","listening","items"):
   if isinstance(data.get(k),list): return data[k]
 raise ValueError("Unsupported listening-audio-bank.json structure")
def script_for(t,i):
 secs=t.get("sections") or t.get("listeningSections") or []
 scripts=t.get("scripts") or t.get("listeningScripts") or []
 if len(scripts)>i and isinstance(scripts[i],str): return scripts[i]
 if isinstance(secs,dict): secs=list(secs.values())
 if len(secs)>i:
  s=secs[i]
  if isinstance(s,str): return s
  if isinstance(s,dict):
   for k in ("script","transcript","audioScript"):
    if isinstance(s.get(k),str): return s[k]
 return None
def tid(t,i):
 for k in ("id","testId","test_id","name"):
  if t.get(k) is not None:return str(t[k])
 return f"listening-test-{i+1:02d}"
async def gen(text,out): await edge_tts.Communicate(text,VOICE,rate=RATE).save(str(out))
async def main():
 if not BANK.exists(): raise SystemExit(f"Listening bank not found: {BANK}")
 tests=items(json.loads(BANK.read_text(encoding="utf-8"))); OUT.mkdir(parents=True,exist_ok=True)
 client=None
 if UPLOAD:
  if not all((B2_BUCKET,B2_KEY_ID,B2_APPLICATION_KEY)): raise SystemExit("Missing B2 secrets.")
  if boto3 is None: raise SystemExit("boto3 is missing.")
  client=boto3.client("s3",endpoint_url=B2_ENDPOINT,region_name=B2_REGION,aws_access_key_id=B2_KEY_ID,aws_secret_access_key=B2_APPLICATION_KEY)
 total=generated=skipped=failed=0
 for i,t in enumerate(tests):
  test=slug(tid(t,i))
  for s in range(4):
   total+=1; text=script_for(t,s)
   if not text: failed+=1; print(f"[FAIL] {test} section {s+1}: no script"); continue
   d=OUT/test; d.mkdir(parents=True,exist_ok=True); f=d/f"section-{s+1}.mp3"
   key=f"listening/{test}/section-{s+1}.mp3"
   if f.exists() and f.stat().st_size>1000: skipped+=1; print(f"[SKIP] {test} section {s+1}")
   else:
    try: await gen(text,f); generated+=1; print(f"[OK] {test} section {s+1}")
    except Exception as e: failed+=1; print(f"[FAIL] {test} section {s+1}: {e}"); continue
   if client:
    try: client.upload_file(str(f),B2_BUCKET,key); print(f"[B2] {key}")
    except Exception as e: failed+=1; print(f"[B2 FAIL] {test} section {s+1}: {e}")
 print(f"Finished: total={total}, generated={generated}, skipped={skipped}, failed={failed}")
 if failed: sys.exit(2)
asyncio.run(main())
