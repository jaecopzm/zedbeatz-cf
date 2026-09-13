package hashids

import (
	"regexp"

	"github.com/speps/go-hashids/v2"
)

var numericRe = regexp.MustCompile(`^\d+$`)

type Coder struct {
	hd *hashids.HashID
}

func New(salt string) (*Coder, error) {
	hd := hashids.NewData()
	hd.Salt = salt
	hd.MinLength = 8
	hd.Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
	h, err := hashids.NewWithData(hd)
	if err != nil {
		return nil, err
	}
	return &Coder{hd: h}, nil
}

func (c *Coder) Encode(id int) string {
	s, _ := c.hd.Encode([]int{id})
	return s
}

func (c *Coder) Decode(s string) (int, bool) {
	ids, err := c.hd.DecodeWithError(s)
	if err != nil || len(ids) != 1 {
		return 0, false
	}
	return ids[0], true
}

func IsNumeric(s string) bool { return numericRe.MatchString(s) }
