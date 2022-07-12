// convert bigInt to string. Future DB should not use bigInt, but for now, this patch is needed.
BigInt.prototype["toJSON"] = function () {
    return this.toString();
  };