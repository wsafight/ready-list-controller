type LinearListCanShowQuery<T> = () => Promise<T[]>;

type UniqueKey = string | number;

type GetRequiredQueryFun = ({
  unReadyItemUids,
}: {
  unReadyItemUids: UniqueKey[];
}) => Promise<void>;

class ReadyListController<T> {
  linearListCanShowQueryIndex: number = -1;

  linearListCanShowQueryList: LinearListCanShowQuery<T>[] = [];

  readyUidSet: Set<UniqueKey> = new Set<UniqueKey>();

  getUid: (item: T) => UniqueKey;

  getRequiredQueryFun: GetRequiredQueryFun;

  constructor({ getUid, getRequiredQueryFun }) {
    this.getUid = getUid;
    this.getRequiredQueryFun = getRequiredQueryFun;
  }

  initialOrReset = ({ linearListCanShowQueryList }) => {
    this.linearListCanShowQueryList = linearListCanShowQueryList;
    this.linearListCanShowQueryIndex = 0;
    this.readyUidSet = new Set();
  };

  get isLoadDone(): boolean {
    return (
      this.linearListCanShowQueryIndex ===
      this.linearListCanShowQueryList.length
    );
  }

  loadLinearList() {
    if (this.isLoadDone) {
      return Promise.resolve();
    }

    return this.linearListCanShowQueryList[
      this.linearListCanShowQueryIndex++
    ]().then(res => {
      const fixedRes = Array.isArray(res) ? res : [res];
      if (fixedRes.length) {
        fixedRes.forEach(item => {
          const uid = this.getUid(item);
          this.readyUidSet.add(uid);
        });
      }
      return res;
    });
  }

  getUnReadyUids = ({ uidList }: { uidList: UniqueKey[] }): UniqueKey[] => {
    if (!uidList) {
      return [];
    }
    const unReadyItems = [];
    uidList.forEach(uid => {
      if (!this.readyUidSet.has(uid)) {
        unReadyItems.push(uid);
      }
    });
    return unReadyItems;
  };

  loadRequireInfoForItems = ({
    uidList,
  }: {
    uidList: string[];
  }): Promise<void> => {
    if (this.isLoadDone) {
      return Promise.resolve();
    }

    const unReadyItemUids = this.getUnReadyUids({ uidList });

    if (!unReadyItemUids.length) {
      return Promise.resolve();
    }

    return this.getRequiredQueryFun({
      unReadyItemUids,
    }).then(() => {
      unReadyItemUids.forEach(item => {
        this.readyUidSet.add(item);
      });
    });
  };
}

export { ReadyListController };

export default ReadyListController;
