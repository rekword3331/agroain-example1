<?php
// ==================== RAZORPAY TEST KEYS ====================
define('RAZORPAY_KEY_ID', 'YOUR_KEY_ID_HERE');      // rzp_test_xxxxxx
define('RAZORPAY_KEY_SECRET', 'YOUR_KEY_SECRET_HERE');

// CORS headers – ताकि आपका HTML पेज इस API को कॉल कर सके
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);

$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// ---------- 1. ऑर्डर क्रिएट करना ----------
if ($method == 'POST' && strpos($request_uri, 'create-order') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = $input['amount']; // ₹ में, जैसे 500
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.razorpay.com/v1/orders");
    curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ":" . RAZORPAY_KEY_SECRET);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'amount' => $amount * 100,
        'currency' => 'INR',
        'receipt' => 'receipt_' . time()
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code == 200) {
        echo $response;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Order creation failed']);
    }
    exit;
}

// ---------- 2. पेमेंट वेरिफाई करना ----------
if ($method == 'POST' && strpos($request_uri, 'verify-payment') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];
    $payment_id = $input['payment_id'];
    $signature = $input['razorpay_signature'];
    
    $body = $order_id . "|" . $payment_id;
    $expected = hash_hmac('sha256', $body, RAZORPAY_KEY_SECRET);
    
    if ($expected === $signature) {
        echo json_encode(['status' => 'success', 'message' => 'Payment verified']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'failure', 'message' => 'Invalid signature']);
    }
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
?>