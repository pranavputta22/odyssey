package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// TimelineEvent
type TimelineEvent int

const (
	ArrivedChamber1 TimelineEvent = iota
	DebatingChamber1
	PassedChamber1
	ArrivedChamber2
	DebatingChamber2
	PassedChamber2
	Governor
	Passed
)

// Action tag type enum
type Tag int

const (
	// Assigned - "bill assigned to specific committee"
	Assigned Tag = iota
	// EffectiveDate - "bill becomes law"
	EffectiveDate
	// FirstReading - "bill is read in subcommittee"
	FirstReading
	// SecondReading - "bill is read by chamber"
	SecondReading
	// ArrivalInSenate - "Passed in house, passed to senate"
	ArrivalInSenate
	// ArrivalInHouse - "Passed in senate, passed to house"
	ArrivalInHouse
	// CoSponsor - "Added Co-Sponsor"
	CoSponsor
	// ThirdReadingVote - "Final reading right before vote"
	ThirdReadingVote
	// CommitteeDebate - "Recommendation by committee of sending bill to house/senate to vote on"
	CommitteeDebate
	// SponsorRemoved - "Representative/Senator backed out "
	SponsorRemoved
	// FiscalRequest - "Request how much a bill costs"
	FiscalRequest
	// DualPassed - "Passed in both houses"
	DualPassed
	// SentToGovernor - "In transit to governor"
	SentToGovernor
	// GovernorApproved - "Governor signature"
	GovernorApproved
	// PublicAct - "Official Law"
	PublicAct
	// BillVotePass - "Bill voted and passed in chamber"
	BillVotePass
	// BillVoteFail - "Bill voted and failed in chamber"
	BillVoteFail
	// Amended - "bill ammended and updated"
	Amended
	// Other - "any other"
	Other
)

// Bill container
type Bill struct {
	Metadata             BillMetadata
	Title                string
	Category             BillCategory
	CommitteeID          string
	ShortSummary         string
	FullSummary          string
	SponsorIDs           []int
	HousePrimarySponsor  int
	SenatePrimarySponsor int
	ChiefSponsor         int
	Actions              []BillAction
	ActionsHash          string
	BillText             BillFullText
	VoteEvents           []BillVoteEvent
	Viewable             bool
	Created              int64
}

// Notification stores the data to send for bill updates
type Notification struct {
	BillInfo BillMetadata `jsonb:"info,omitempty"`
	Text     string       `jsonb:"number,omitempty"`
}

// BillMetadata stores bill number, general assembly number, and chamber
type BillMetadata struct {
	Number   int64  `jsonb:"Number,omitempty"`
	Assembly int64  `jsonb:"Assembly,omitempty"`
	Chamber  string `jsonb:"Chamber,omitempty"`
	URL      string `jsonb:"URL,omitempty"`
}

// BillFullText stores the data from the full text html data
type BillFullText struct {
	URL      string `jsonb:"url,omitempty"`
	FullText string `jsonb:"fullText,omitempty"`
}

// BillAction stores a single action event data
type BillAction struct {
	Date        int64  `jsonb:"date,omitempty"`
	Chamber     string `jsonb:"chamber,omitempty"`
	Description string `jsonb:"description,omitempty"`
	Tag         Tag    `jsonb:"tag,omitempty"`
}

// BillCategory enum
type BillCategory string

const (
	Agriculture                  BillCategory = "Agriculture"
	CriminalCivilJustice                      = "Justice"
	EconomyFinance                            = "Economy"
	ElementarySecondaryEducation              = "K-12"
	HigherEducation                           = "College"
	EnergyEnvironment                         = "Energy"
	Healthcare                                = "Healthcare"
	Infrastructure                            = "Infrastructure"
	Internal                                  = "Internal"
	LaborCommerce                             = "Labor"
	Pensions                                  = "Pensions"
	PublicUtilities                           = "Utility"
	StateLocalGovernment                      = "Government"
	Taxation                                  = "Taxes"
	Technology                                = "Tech"
	VeteransAffairs                           = "VA"
	OtherCategory                             = "Other"
	DNE                                       = "DNE"
)

// BillVoteEvent stores the voting outcome of a pdf
type BillVoteEvent struct {
	Chamber string            `jsonb:"chamber,omitempty"`
	Votes   map[string]string `jsonb:"votes,omitempty"`
}

// Value is an implemented method from database/sql/driver which converts Contact into jsonb
func (ba BillAction) Value() (driver.Value, error) {
	return json.Marshal(ba)
}

// Value converts BillFullText into a json format
func (bft BillFullText) Value() (driver.Value, error) {
	return json.Marshal(bft)
}

// Value converts BillFullText into a json format
func (bve BillVoteEvent) Value() (driver.Value, error) {
	return json.Marshal(bve)
}

// Scan converts BillFullText from json into a struct
func (bft *BillFullText) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &bft)
}

// Scan is an implemented method from database/sql/driver which converts jsonb into Contact
func (ba *BillAction) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &ba)
}

// Scan is an implemented method from database/sql/driver which converts jsonb into Contact
func (bve *BillVoteEvent) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &bve)
}
