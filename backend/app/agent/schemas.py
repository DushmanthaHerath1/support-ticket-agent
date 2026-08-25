from decimal import Decimal
from pydantic import BaseModel, Field, model_validator

from app.db.models import TicketCategory, SentimentType, ResolutionType


class TicketResolution(BaseModel):
    """Structured resolution summary for a support ticket.

    Not currently instantiated by resolve_ticket (that tool takes flat typed
    arguments instead) — this model exists for future reuse, e.g. as the
    response model for GET /tickets. Keep it correct even while unused, so
    it's trustworthy whenever something does start relying on it.
    """

    category: TicketCategory = Field(
        description="The primary category of the customer request."
    )
    sentiment: SentimentType = Field(
        description="Customer's emotional sentiment detected from the conversation."
    )
    resolution: ResolutionType = Field(
        description="The final outcome/action taken for this customer inquiry."
    )
    refund_amount: Decimal | None = Field(
        default=None,
        description="The final refund amount issued in USD, or None if no refund was granted.",
    )
    summary: str = Field(
        description="A concise 1-2 sentence summary of what occurred and how it was resolved."
    )

    @model_validator(mode="after")
    def validate_refund_consistency(self) -> "TicketResolution":
        if self.resolution == ResolutionType.REFUND_ISSUED and (
            self.refund_amount is None or self.refund_amount <= 0
        ):
            raise ValueError(
                "refund_amount must be greater than 0 when resolution is REFUND_ISSUED"
            )
        if self.resolution != ResolutionType.REFUND_ISSUED:
            self.refund_amount = None
        return self