const path = require('path');
const crypto = require('crypto');
const { InvoiceFinancingContract, InvoiceStatus } = require(path.join(__dirname, '..', 'managed', 'invoice_financing', 'index.cjs'));

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

function computeCommitment(amount, buyer, seller, dueDate, salt) {
    const data = `${amount}:${buyer}:${seller}:${dueDate}:${salt}`;
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

async function runTests() {
    console.log("🧪 [InvoiceChain Test Suite] Starting Midnight Compact Circuit Unit Tests...\n");
    let passed = 0;
    let failed = 0;

    const mockWitness = {
        invoiceAmount: 50000n, // $50,000 USD
        buyerId: "0x" + crypto.createHash('sha256').update("ACME_CORP_GLOBAL").digest('hex'),
        sellerId: "0x" + crypto.createHash('sha256').update("TECH_SUPPLIES_MSME").digest('hex'),
        dueDate: 1767225600n,
        salt: "0x" + crypto.randomBytes(32).toString('hex')
    };

    const commitment = computeCommitment(
        mockWitness.invoiceAmount,
        mockWitness.buyerId,
        mockWitness.sellerId,
        mockWitness.dueDate,
        mockWitness.salt
    );

    const lenderIdA = "0x" + crypto.createHash('sha256').update("APEX_CAPITAL_LENDER_A").digest('hex');
    const lenderIdB = "0x" + crypto.createHash('sha256').update("HORIZON_FINANCE_LENDER_B").digest('hex');

    const contract = new InvoiceFinancingContract();

    // Test 1: Successful Invoice Registration
    try {
        console.log("TEST 1: MSME Invoice Registration (registerInvoice circuit)");
        const regResult = contract.registerInvoice(mockWitness, commitment);
        assert(regResult.success === true, "registerInvoice returned success: false");
        assert(regResult.status === InvoiceStatus.Open, "Ledger status should be Open");
        assert(contract.invoiceCommitment === commitment, "Public ledger commitment mismatch");
        assert(contract.processedNullifiers.has(commitment), "Commitment set should contain new commitment");
        console.log("  ✅ Passed: Invoice successfully registered with Open status on public ledger.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 1 Failed:", err.message);
        failed++;
    }

    // Test 2: Successful Invoice Financing by Lender A
    try {
        console.log("TEST 2: First Financing Attempt by Lender A (financeInvoice circuit)");
        const finResult = contract.financeInvoice(mockWitness, commitment, lenderIdA);
        assert(finResult.success === true, "financeInvoice returned success: false");
        assert(finResult.status === InvoiceStatus.Financed, "Ledger status should be Financed");
        assert(contract.financedLender === lenderIdA, "Financed lender mismatch");
        console.log("  ✅ Passed: Invoice financed by Lender A. Public status updated to Financed.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 2 Failed:", err.message);
        failed++;
    }

    // Test 3: Rejection of Duplicate Financing Attempt by Lender B (Anti-Fraud Proof)
    try {
        console.log("TEST 3: Duplicate Financing Attempt by Lender B (Anti-Fraud Proof)");
        let threw = false;
        try {
            contract.financeInvoice(mockWitness, commitment, lenderIdB);
        } catch (err) {
            threw = true;
            assert(err.message.includes("Invoice is already Financed"), `Unexpected error message: ${err.message}`);
            console.log(`  🛡️ Circuit Rejection Log: "${err.message}"`);
        }
        assert(threw === true, "Circuit failed to reject duplicate financing attempt!");
        assert(contract.financedLender === lenderIdA, "Lender ID should remain Lender A");
        console.log("  ✅ Passed: Duplicate financing attempt strictly rejected by circuit without exposing private witness.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 3 Failed:", err.message);
        failed++;
    }

    // Test 4: Successful Invoice Settlement by Buyer
    try {
        console.log("TEST 4: Invoice Settlement by Buyer (settleInvoice circuit)");
        const settlePayment = 50000n;
        const settleResult = contract.settleInvoice(mockWitness, commitment, settlePayment);
        assert(settleResult.success === true, "settleInvoice returned success: false");
        assert(settleResult.status === InvoiceStatus.Settled, "Ledger status should be Settled");
        assert(contract.settlementAmount === settlePayment, "Settlement amount mismatch");
        console.log("  ✅ Passed: Invoice settled successfully. Final status: Settled.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 4 Failed:", err.message);
        failed++;
    }

    // Test 5: Rejection of Double Settlement or Invalid State Transition
    try {
        console.log("TEST 5: Invalid Settlement Rejection on already Settled Invoice");
        let threw = false;
        try {
            contract.settleInvoice(mockWitness, commitment, 50000n);
        } catch (err) {
            threw = true;
            assert(err.message.includes("must be in Financed state"), `Unexpected error message: ${err.message}`);
        }
        assert(threw === true, "Circuit failed to reject settlement on already settled invoice");
        console.log("  ✅ Passed: Invalid state transition rejected.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 5 Failed:", err.message);
        failed++;
    }

    console.log("--------------------------------------------------");
    console.log(`SUMMARY: ${passed} / ${passed + failed} Tests Passed (${failed === 0 ? '100% SUCCESS' : 'FAILED'})`);
    console.log("--------------------------------------------------\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
