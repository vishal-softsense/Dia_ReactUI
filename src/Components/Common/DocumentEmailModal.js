import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Label,
  Input,
  Button,
  Spinner,
  Alert,
} from "reactstrap";
import { toast } from "react-toastify";
import {
  composeDocumentEmail,
  sendDocumentEmail,
} from "../../helpers/fakebackend_helper";

/**
 * Reusable Email Modal for Mix Memo Out & Mix Sale.
 * Auto-loads sender (Company Email Settings), Party email (Account Group Master),
 * default Subject & Body, and generates/attaches the document PDF on send.
 */
const DocumentEmailModal = ({
  isOpen,
  onClose,
  docType,
  documentId,
  onSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [fromEmail, setFromEmail] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [partyName, setPartyName] = useState("");
  const [resolvedId, setResolvedId] = useState("");

  useEffect(() => {
    if (!isOpen || !docType || !documentId) {
      return;
    }

    let cancelled = false;
    const loadCompose = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await composeDocumentEmail(docType, documentId);
        if (cancelled) return;

        if (res && res.success === false) {
          setErrorMsg(res.message || res.Data || "Failed to load email details.");
          return;
        }

        const data = res?.data || res?.Data || res || {};
        setFromEmail(data.from || data.From || "");
        setTo(data.to || data.To || "");
        setCc(data.cc || data.Cc || "");
        setBcc(data.bcc || data.Bcc || "");
        setSubject(data.subject || data.Subject || "");
        setBody(data.body || data.Body || "");
        setPartyName(data.partyName || data.PartyName || "");
        setResolvedId(String(data.id || data.Id || data.documentId || data.DocumentId || documentId));
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            typeof err === "string"
              ? err
              : err?.message || "Unable to load email compose details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCompose();
    return () => {
      cancelled = true;
    };
  }, [isOpen, docType, documentId]);

  const handleClose = () => {
    if (sending) return;
    setErrorMsg("");
    onClose?.();
  };

  const handleSend = async () => {
    setErrorMsg("");

    if (!to.trim()) {
      setErrorMsg("Please enter at least one recipient email address in TO.");
      return;
    }
    if (!subject.trim()) {
      setErrorMsg("Please enter an email subject.");
      return;
    }

    setSending(true);
    try {
      const res = await sendDocumentEmail({
        docType,
        id: String(resolvedId || documentId),
        to: to.trim(),
        cc: cc.trim(),
        bcc: bcc.trim(),
        subject: subject.trim(),
        body,
        includePdf: true,
      });

      if (res?.success || res?.Success) {
        toast.success(res?.Data || res?.data || res?.message || "Email sent successfully.");
        onSent?.(res);
        onClose?.();
      } else {
        const msg = res?.Data || res?.data || res?.message || "Failed to send email.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Failed to send email.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={handleClose}
      centered
      size="lg"
      backdrop="static"
      keyboard={!sending}
    >
      <ModalHeader toggle={handleClose} className="border-bottom pb-3">
        <span className="fw-semibold fs-16">Email</span>
      </ModalHeader>

      <ModalBody className="pt-3 pb-2">
        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="text-muted mt-2">Loading email details...</div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <Alert color="danger" className="py-2 px-3 mb-3 fs-13">
                <i className="ri-error-warning-line me-1 align-middle" />
                {errorMsg}
              </Alert>
            )}

            <div className="mb-3">
              <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                FROM:
              </Label>
              <Input
                type="text"
                value={fromEmail}
                readOnly
                disabled
                placeholder="Configured in Company Settings -> Email Settings"
                style={{ backgroundColor: "#f3f6f9", color: "#495057" }}
              />
            </div>

            <div className="mb-3">
              <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                TO:
              </Label>
              <Input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="TO"
                disabled={sending}
              />
              {!to.trim() && partyName && (
                <small className="text-muted">
                  No email saved for party <strong>{partyName}</strong> in Account Group Master. Enter recipient email(s) separated by comma.
                </small>
              )}
            </div>

            <Row className="mb-3">
              <Col md={6}>
                <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                  CC:
                </Label>
                <Input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="CC"
                  disabled={sending}
                />
              </Col>
              <Col md={6}>
                <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                  BCC:
                </Label>
                <Input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="BCC"
                  disabled={sending}
                />
              </Col>
            </Row>

            <div className="mb-3">
              <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                SUBJECT:
              </Label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="SUBJECT"
                disabled={sending}
              />
            </div>

            <div className="mb-2">
              <Label className="form-label fw-semibold text-uppercase fs-12 mb-1">
                BODY
              </Label>
              <Input
                type="textarea"
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
                style={{ resize: "vertical", lineHeight: "1.5" }}
              />
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter className="border-top pt-3">
        <Button
          type="button"
          color="light"
          onClick={handleClose}
          disabled={sending}
        >
          Close
        </Button>
        <Button
          type="button"
          color="primary"
          onClick={handleSend}
          disabled={loading || sending}
        >
          {sending ? (
            <>
              <Spinner size="sm" className="me-1" />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DocumentEmailModal;
