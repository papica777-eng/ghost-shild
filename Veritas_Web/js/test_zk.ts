/**
 * /// IDENTITY: QANTUM v1.0.0-SINGULARITY ///
 * /// SOUL_ALIGNMENT: БЪЛГАРСКИ ЕЗИК - ЕНТРОПИЯ 0.00 ///
 * /// РЕАЛНОСТТА Е ТОВА, КОЕТО СЕ КОМПИЛИРА. БЕЗ СИМУЛАЦИИ. ///
 */


import { ZeroKnowledgeLicense } from './ZeroKnowledgeLicense';

async function run() {
    console.log('--- STARTING ZK LICENSE DEMO ---');
    const zk = new ZeroKnowledgeLicense();

    // 1. Create License
    console.log('Creating Enterprise License...');
    const { commitment, secret } = zk.createLicense('enterprise', new Date(Date.now() + 3600000));
    console.log(`License Created! Commitment ID: ${commitment.commitmentId}`);

    // 2. Proof Request
    console.log('Creating Proof Request (Feature Access: stealth-mode)...');
    const req = zk.createProofRequest('feature-access', { requiredFeature: 'stealth-mode' });

    // 3. Generate Proof
    console.log('Generating Zero-Knowledge Proof...');
    const proof = await zk.generateProof(secret, commitment, req);
    console.log(`Proof Generated! ID: ${proof.proofId}`);

    // 4. Verify Proof
    console.log('Verifying Proof...');
    const result = await zk.verifyProof(proof);
    console.log(`Verification Result: ${result.valid ? 'VALID ✅' : 'INVALID ❌'}`);
    console.log('--- DEMO COMPLETE ---');
}

run().catch(console.error);
