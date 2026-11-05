/** Isolated tampered-artifact runtime check; no file changes or database calls. */
// @ts-ignore Bun-only local verification harness.
import {mock} from "bun:test";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
mock.module("server-only",()=>({}));
const path=fileURLToPath(new URL("../data/hsi/ra-anti-tnf/transfer.json",import.meta.url));
const tampered=JSON.parse(readFileSync(path,"utf8"));tampered.artifactHash="f".repeat(64);
mock.module(path,()=>({default:tampered}));
const {loadAkshInvestigationRelease,akshInvestigationReleases}=await import("../lib/hsi/investigation-corpus.server");
const listing=akshInvestigationReleases.find(r=>r.id==="ra-anti-tnf-evidence");if(listing?.readiness?.available!==false)throw Error("Tampered corpus must be listed unavailable");
let denied=false;try{await loadAkshInvestigationRelease("ra-anti-tnf-evidence",null)}catch(e){denied=(e as {code?:string}).code==="research_artifact_not_ready"}
if(!denied)throw Error("Tampered corpus must fail closed without a fallback");
const separate=await loadAkshInvestigationRelease("hsi-research-snapshot",null);if(!separate.entities.length)throw Error("Unrelated local corpus must remain usable");
console.log(JSON.stringify({product:"aksh",tamperedCorpusUnavailable:true,tamperedLoadDenied:true,separateLocalCorpusUsable:true,databaseTested:false}));
