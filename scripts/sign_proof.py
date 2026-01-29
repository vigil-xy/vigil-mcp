import json
import sys

try:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing required argument: payload"}), file=sys.stderr)
        sys.exit(1)
    
    payload = json.loads(sys.argv[1])
    
    from vigil_cryptographicsign import sign_action
    proof = sign_action(payload)
    
    print(json.dumps(proof))
except json.JSONDecodeError as e:
    print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
    sys.exit(1)
except ImportError as e:
    print(json.dumps({"error": f"Failed to import vigil_cryptographicsign: {str(e)}"}), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Failed to sign action: {str(e)}"}), file=sys.stderr)
    sys.exit(1)
